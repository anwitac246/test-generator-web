from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz
import os
import numpy as np
import faiss
import uuid
import base64
from io import BytesIO
from sentence_transformers import SentenceTransformer
from PIL import Image as PILImage
import requests
import re
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
import json
from pymongo import MongoClient
from bson.objectid import ObjectId
import datetime
import pandas as pd

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

app = Flask(__name__)
CORS(app)

# MongoDB connection
mongo_uri = os.getenv('MONGODB_URI')
mongo_client = MongoClient(mongo_uri)
db = mongo_client['jeeAce']
tests_collection = db['tests']

pdf_folder = "./pdfs"
output_dir = "./pdf_images"
os.makedirs(output_dir, exist_ok=True)
os.makedirs(pdf_folder, exist_ok=True)

embedder = SentenceTransformer('all-MiniLM-L6-v2')

GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama3-8b-8192"

question_faiss_index = faiss.IndexFlatL2(384)
image_faiss_index = faiss.IndexFlatL2(384)

questions_data = [] 
images_data = []
question_image_associations = []  

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    pdf_path = os.path.join(pdf_folder, file.filename)
    file.save(pdf_path)
    
    extracted_questions, extracted_images, associations = extract_pdf_data_enhanced(pdf_path, output_dir)
    
    store_enhanced_data_to_faiss(extracted_questions, extracted_images, associations)
    
    return jsonify({
        "message": "PDF processed successfully",
        "questions_extracted": len(extracted_questions),
        "images_extracted": len(extracted_images),
        "associations_found": len(associations),
        "pdf_name": file.filename
    }), 200

@app.route('/api/generate-questions', methods=['POST'])
def generate_questions_api():
    subject = request.json.get('subject', 'All')
    count = min(int(request.json.get('count', 10)), 25)
    topics = request.json.get('topics', [])
    topic_filter = topics[0] if topics else None

    if topic_filter:
        relevant_questions = retrieve_relevant_questions(topic_filter, subject, count * 2)
    else:
        relevant_questions = filter_questions_by_subject(subject, count * 2)

    generated_questions = []
    
    for question_data in relevant_questions[:count]:
        mcq = generate_enhanced_mcq(question_data)
        
        if mcq:
            associated_image = find_associated_image(question_data['id'])
            
            question_obj = {
                "question": mcq["question"],
                "options": mcq["options"][:4],
                "answer": mcq["answer"],
                "subject": question_data.get("subject"),
                "source_text": question_data.get("text", "")[:200] + "...",
                "page": question_data.get("page"),
                "pdf_source": question_data.get("source_pdf")
            }
            
            if associated_image and os.path.exists(associated_image.get("image_path", "")):
                try:
                    with open(associated_image["image_path"], "rb") as img_file:
                        img_data = base64.b64encode(img_file.read()).decode('utf-8')
                        question_obj["image_data"] = f"data:image/jpeg;base64,{img_data}"
                        question_obj["image_caption"] = associated_image.get("caption", "")
                except Exception as e:
                    question_obj["image_error"] = f"Could not load image: {str(e)}"
            
            generated_questions.append(question_obj)

    return jsonify({
        "questions": generated_questions,
        "subject": subject,
        "count": len(generated_questions),
        "total_questions_in_db": len(questions_data),
        "total_images_in_db": len(images_data)
    }), 200

@app.route('/api/save-test', methods=['POST'])
def save_test():
    data = request.json
    user_id = data.get('userId')
    test_config = data.get('testConfig')
    
    if not user_id or not test_config:
        return jsonify({"error": "Missing userId or testConfig"}), 400

    test_data = {
        "userId": user_id,
        "testType": test_config.get("testType"),
        "subjects": test_config.get("subjects"),
        "totalQuestions": test_config.get("totalQuestions"),
        "timeLimit": test_config.get("timeLimit"),
        "questions": test_config.get("questions"),
        "createdAt": datetime.datetime.utcnow(),
    }

    result = tests_collection.insert_one(test_data)
    return jsonify({"testId": str(result.inserted_id)}), 201

@app.route('/api/save-test-result', methods=['POST'])
def save_test_result():
    data = request.json
    user_id = data.get('userId')
    test_id = data.get('testId')
    results = data.get('results')
    
    if not user_id or not test_id or not results:
        return jsonify({"error": "Missing userId, testId, or results"}), 400

    try:
        test_id_obj = ObjectId(test_id)
        tests_collection.update_one(
            {"_id": test_id_obj, "userId": user_id},
            {
                "$set": {
                    "score": results.get("score"),
                    "total": results.get("total"),
                    "percentage": results.get("percentage"),
                    "detailedResults": results.get("details"),
                    "completedAt": datetime.datetime.utcnow(),
                }
            }
        )
        return jsonify({"message": "Test result saved successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to save test result: {str(e)}"}), 500

@app.route('/api/test-history', methods=['POST'])
def get_test_history():
    user_id = request.json.get('userId')
    if not user_id:
        return jsonify({"error": "Missing userId"}), 400

    tests = tests_collection.find({"userId": user_id}).sort("createdAt", -1)
    test_list = [
        {
            "testId": str(test["_id"]),
            "testType": test["testType"],
            "subjects": test["subjects"],
            "totalQuestions": test["totalQuestions"],
            "timeLimit": test["timeLimit"],
            "questions": test["questions"],  # Include questions
            "createdAt": test["createdAt"].isoformat(),
            "score": test.get("score"),
            "total": test.get("total"),
            "percentage": test.get("percentage"),
            "completedAt": test.get("completedAt", None).isoformat() if test.get("completedAt") else None,
        }
        for test in tests
    ]
    return jsonify({"tests": test_list}), 200

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    subjects = set()
    for item in questions_data:
        if item.get("subject"):
            subjects.add(item["subject"])
    
    return jsonify({
        "subjects": list(subjects)
    }), 200

def extract_pdf_data_enhanced(pdf_path, output_dir):
    doc = fitz.open(pdf_path)
    filename = os.path.basename(pdf_path)
    
    extracted_questions = []
    extracted_images = []
    associations = []
    
    current_subject = None
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        lower_text = text.lower()
        
        if "physics" in lower_text:
            current_subject = "Physics"
        elif "chemistry" in lower_text:
            current_subject = "Chemistry"
        elif "math" in lower_text or "mathematics" in lower_text:
            current_subject = "Mathematics"
        elif "biology" in lower_text:
            current_subject = "Biology"
        
        text_blocks = page.get_text("dict")
        
        questions_on_page = extract_questions_from_text(text, page_num, filename, current_subject)
        extracted_questions.extend(questions_on_page)
        
        for img_index, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            image_filename = f"{filename}_p{page_num+1}_img{img_index+1}.{image_ext}"
            image_path = os.path.join(output_dir, image_filename)
            
            with open(image_path, "wb") as f:
                f.write(image_bytes)
            
            img_rect = fitz.Rect(img[1:5]) 
            
            nearby_text = extract_text_near_image(page, img_rect, distance_threshold=100)
            
            image_data = {
                "id": str(uuid.uuid4()),
                "image_path": image_path,
                "page": page_num + 1,
                "source_pdf": filename,
                "subject": current_subject,
                "position": {
                    "x": img_rect.x0,
                    "y": img_rect.y0,
                    "width": img_rect.width,
                    "height": img_rect.height
                },
                "caption": nearby_text,
                "surrounding_text": text  
            }
            
            extracted_images.append(image_data)
            
            for question in questions_on_page:
                similarity_score = calculate_text_similarity(question["text"], nearby_text)
                if similarity_score > 0.3:
                    associations.append({
                        "question_id": question["id"],
                        "image_id": image_data["id"],
                        "similarity_score": similarity_score,
                        "association_type": "semantic"
                    })
    
    doc.close()
    return extracted_questions, extracted_images, associations

def extract_questions_from_text(text, page_num, filename, subject):
    questions = []
    
    question_patterns = [
        r'(\d+\.\s+.*?(?=\d+\.\s+|\n\n|\Z))', 
        r'(Q\d+\.\s+.*?(?=Q\d+\.\s+|\n\n|\Z))',  
        r'(\(\d+\)\s+.*?(?=\(\d+\)|\n\n|\Z))', 
        r'(Example\s+\d+.*?(?=Example\s+\d+|\n\n|\Z))', 
    ]
    
    for i, pattern in enumerate(question_patterns):
        matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
        for match in matches:
            if len(match.strip()) > 50:  
                question_data = {
                    "id": str(uuid.uuid4()),
                    "text": match.strip(),
                    "page": page_num + 1,
                    "source_pdf": filename,
                    "subject": subject,
                    "extraction_pattern": i,
                    "word_count": len(match.split())
                }
                questions.append(question_data)
    
    return questions

def extract_text_near_image(page, img_rect, distance_threshold=100):
    words = page.get_text("words")
    nearby_words = []
    
    for word in words:
        word_rect = fitz.Rect(word[:4])
        
        distance = min(
            abs(word_rect.x0 - img_rect.x1), 
            abs(word_rect.x1 - img_rect.x0), 
            abs(word_rect.y0 - img_rect.y1), 
            abs(word_rect.y1 - img_rect.y0)  
        )
        
        if distance <= distance_threshold:
            nearby_words.append(word[4])  
    
    return " ".join(nearby_words)

def calculate_text_similarity(text1, text2):
    if not text1 or not text2:
        return 0.0
    
    try:
        embeddings = embedder.encode([text1, text2])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return float(similarity)
    except:
        return 0.0

def store_enhanced_data_to_faiss(questions, images, associations):
    global questions_data, images_data, question_image_associations
   
    if questions:
        question_embeddings = []
        for question in questions:
            embedding = embedder.encode(question["text"])
            question_embeddings.append(embedding)
            questions_data.append(question)
        
        if question_embeddings:
            embeddings_np = np.array(question_embeddings, dtype='float32')
            question_faiss_index.add(embeddings_np)
    
    if images:
        image_embeddings = []
        for image in images:
            text_to_embed = f"{image.get('caption', '')} {image.get('surrounding_text', '')[:500]}"
            embedding = embedder.encode(text_to_embed)
            image_embeddings.append(embedding)
            images_data.append(image)
        
        if image_embeddings:
            embeddings_np = np.array(image_embeddings, dtype='float32')
            image_faiss_index.add(embeddings_np)
    
    question_image_associations.extend(associations)

def retrieve_relevant_questions(query, subject, k=10):
    if not questions_data:
        return []
    
    query_embedding = embedder.encode([query])
    
    distances, indices = question_faiss_index.search(query_embedding.astype('float32'), min(k*2, len(questions_data)))
    
    relevant_questions = []
    for idx in indices[0]:
        if idx < len(questions_data):
            question = questions_data[idx]
            if subject == 'All' or question.get('subject') == subject:
                relevant_questions.append(question)
    
    return relevant_questions[:k]

def filter_questions_by_subject(subject, k=10):
    filtered_questions = []
    for question in questions_data:
        if subject == 'All' or question.get('subject') == subject:
            filtered_questions.append(question)
    
    return filtered_questions[:k]

def find_associated_image(question_id):
    for association in question_image_associations:
        if association["question_id"] == question_id:
            image_id = association["image_id"]
            for image in images_data:
                if image["id"] == image_id:
                    return image
    return None

def generate_enhanced_mcq(question_data):
    text = question_data.get("text", "")
    subject = question_data.get("subject", "")
    
    prompt = f"""
You are an expert JEE {subject} tutor. Based on the following question/content from a JEE preparation material, generate one high-quality multiple-choice question with exactly 4 options.

Content:
{text}

Requirements:
- Create a challenging question suitable for JEE Main level
- Provide exactly 4 options labeled A, B, C, D
- Make options plausible but only one correct
- Test conceptual understanding and problem-solving
- If the content contains a specific question, adapt it into MCQ format
- If the content is explanatory, create a question that tests the concept

Format:
Q: [Your question here]
A. [Option A]
B. [Option B]  
C. [Option C]
D. [Option D]
Answer: [A/B/C/D]
"""
    
    try:
        response = requests.post(
            GROQ_API_URL,
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': GROQ_MODEL,
                'messages': [{'role': 'user', 'content': prompt}],
                'temperature': 0.7,
                'max_tokens': 400
            }
        )
        
        if response.status_code == 200:
            response_data = response.json()
            if "choices" in response_data and response_data["choices"]:
                mcq_text = response_data["choices"][0]["message"]["content"].strip()
                return parse_mcq_string(mcq_text)
    except Exception as e:
        print(f"Error generating MCQ: {e}")
    
    return None

def parse_mcq_string(mcq_str):
    q_match = re.search(r'Q:\s*(.*?)\s*(?=A\.)', mcq_str, re.DOTALL)
    question = q_match.group(1).strip() if q_match else ""

    options = []
    for option_letter in ['A', 'B', 'C', 'D']:
        if option_letter == 'D':
            pattern = rf'{option_letter}\.\s*(.*?)(?=Answer:|\Z)'
        else:
            next_letter = chr(ord(option_letter) + 1)
            pattern = rf'{option_letter}\.\s*(.*?)(?={next_letter}\.)'
        
        match = re.search(pattern, mcq_str, re.DOTALL)
        if match:
            option_text = match.group(1).strip().split('\n')[0].strip()
            options.append(option_text)

    ans_match = re.search(r'Answer:\s*([ABCD])', mcq_str)
    answer = ans_match.group(1).strip() if ans_match else ""

    return {
        "question": question,
        "options": options,
        "answer": answer
    }

@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    request_data = request.json
    questions = request_data.get("questions", [])
    user_answers = request_data.get("userAnswers", [])
    
    if not questions or not user_answers or len(questions) != len(user_answers):
        return jsonify({"error": "Invalid input"}), 400

    score = 0
    detailed_results = []

    for i, (q, ua) in enumerate(zip(questions, user_answers)):
        correct_answer = q.get("answer", "").strip().upper()
        user_answer = ua.strip().upper() if ua else ""
        is_correct = correct_answer == user_answer
        
        if is_correct:
            score += 1
            
        detailed_results.append({
            "question": q.get("question"),
            "correct_answer": correct_answer,
            "user_answer": user_answer,
            "is_correct": is_correct,
            "subject": q.get("subject", "Unknown")
        })

    return jsonify({
        "total": len(questions),
        "score": score,
        "percentage": round((score / len(questions)) * 100, 2),
        "details": detailed_results
    }), 200

@app.route('/api/stats', methods=['GET'])
def get_stats():
    subject_counts = {}
    for question in questions_data:
        subject = question.get('subject', 'Unknown')
        subject_counts[subject] = subject_counts.get(subject, 0) + 1
    
    return jsonify({
        "total_questions": len(questions_data),
        "total_images": len(images_data),
        "total_associations": len(question_image_associations),
        "subject_distribution": subject_counts,
        "questions_with_images": len([a for a in question_image_associations])
    }), 200

def process_all_pdfs_on_startup():
    print("Processing all existing PDFs in folder...")
    global questions_data, images_data, question_image_associations
    
    questions_data.clear()
    images_data.clear()
    question_image_associations.clear()
    
    for filename in os.listdir(pdf_folder):
        if filename.lower().endswith('.pdf'):
            pdf_path = os.path.join(pdf_folder, filename)
            print(f"Processing {filename}...")
            try:
                extracted_questions, extracted_images, associations = extract_pdf_data_enhanced(pdf_path, output_dir)
                store_enhanced_data_to_faiss(extracted_questions, extracted_images, associations)
                print(f"  - Questions: {len(extracted_questions)}")
                print(f"  - Images: {len(extracted_images)}")
                print(f"  - Associations: {len(associations)}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")
    
    print(f"Finished processing PDFs. Total: {len(questions_data)} questions, {len(images_data)} images, {len(question_image_associations)} associations")

if __name__ == '__main__':
    process_all_pdfs_on_startup()
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))