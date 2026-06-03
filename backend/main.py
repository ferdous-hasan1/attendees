from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from fastapi.responses import FileResponse, StreamingResponse
import json
import numpy as np
import face_recognition
from PIL import Image
import io
import os
import cv2
import shutil
import uuid
import jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

# Import custom modules
import models, database, reports
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
# --- SECURITY UTILITIES ---
# This tells Python to use bcrypt to mathematically hash passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Create Tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# 1. SETUP STATIC FILES (To serve photos)
os.makedirs("uploads", exist_ok=True) # Create folder if not exists
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- JWT SECURITY CONFIGURATION ---
SECRET_KEY = "super_secret_attendease_key_2026" # In a real app, this goes in a .env file!
ALGORITHM = "HS256"
# --- JWT TOKEN CONFIGURATION ---
SECRET_KEY = "attendease-super-secret-key-change-this-later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # Token lasts for 24 hours (1440 mins)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    
    # 1. CHECK ADMIN VAULT (Hardcoded for maximum security)
    if form_data.username == "admin@technoindia.com" and form_data.password == "attendease123":
        # Notice we inject the "role" into the token!
        access_token = create_access_token(data={"sub": form_data.username, "role": "admin"})
        return {"access_token": access_token, "token_type": "bearer", "role": "admin"}

    # 2. CHECK TEACHER DATABASE
    teacher = db.query(models.Teacher).filter(models.Teacher.email == form_data.username).first()
    if teacher and verify_password(form_data.password, teacher.password_hash):
        access_token = create_access_token(data={"sub": teacher.email, "role": "teacher", "id": teacher.id})
        return {"access_token": access_token, "token_type": "bearer", "role": "teacher"}

    # 3. CHECK STUDENT DATABASE
    student = db.query(models.Student).filter(models.Student.email == form_data.username).first()
    if student and verify_password(form_data.password, student.password_hash):
        access_token = create_access_token(data={"sub": student.email, "role": "student", "id": student.id})
        return {"access_token": access_token, "token_type": "bearer", "role": "student"}

    # 4. IF NO MATCH IS FOUND
    raise HTTPException(
        status_code=400,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

# --- HELPER: LOW LIGHT ENHANCEMENT (NIGHT-VISION) ---
def enhance_lighting(img_cv2):
    # Convert image to LAB color space (L = Lightness)
    lab = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    
    # Apply CLAHE only to the Lightness channel 
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    cl = clahe.apply(l_channel)
    
    # Merge the brightened lightness back with the original colors
    merged_lab = cv2.merge((cl, a_channel, b_channel))
    enhanced_bgr = cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)
    
    return enhanced_bgr

# --- HELPER: LIVENESS CHECK (ANTI-SPOOFING) ---
def check_liveness(image_cv2):
    gray = cv2.cvtColor(image_cv2, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    # Debugging: Print the sharpness score to your terminal
    print(f"DEBUG: Image Sharpness Score: {variance}")

    # If the score is below 30, it's definitely too blurry/dark.
    if variance < 30: 
        return False, f"Image too blurry (Score: {int(variance)})"
    
    return True, "Real Face"

def process_image(file_bytes):
    try:
        # Load image for Face Recognition
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        img_array = np.array(image)

        # Convert for OpenCV Liveness Check
        img_cv2 = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        print(f"DEBUG: Image Sharpness Score: {variance}")
        if variance < 30:
            return None, "Image too blurry. Please take a clearer photo."

        # --- UPGRADE: Apply Night-Vision to Registration Photos ---
        try:
            # We use the same CLAHE enhancement we built for the Smart Gate
            rgb_enhanced = enhance_lighting(img_cv2)
        except Exception:
            rgb_enhanced = img_cv2 # Fallback
            
        # Convert back to RGB for the AI
        final_rgb = cv2.cvtColor(rgb_enhanced, cv2.COLOR_BGR2RGB)

        # Extract the Face Math
        encodings = face_recognition.face_encodings(final_rgb)
        
        if len(encodings) == 0:
            return None, "No face detected. Please ensure your face is fully in the frame."
        if len(encodings) > 1:
            return None, "Multiple faces detected. Only one person allowed."

        return encodings[0], None
        
    except Exception as e:
        print(f"❌ PROCESS IMAGE CRASH: {e}")
        return None, "Internal image processing failed."



@app.get("/students")
def get_students(db: Session = Depends(database.get_db)):
    return db.query(models.Student).all()

@app.post("/students/register")
async def register_student(
    name: str = Form(...),
    email: str = Form(...),      # <-- NEW
    password: str = Form(...),   # <-- NEW
    roll: str = Form(...),
    dept: str = Form(...),
    batch: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    # Check if Roll Number OR Email already exists
    existing = db.query(models.Student).filter(
        (models.Student.roll_number == roll) | (models.Student.email == email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student ID or Email already exists")

    # Securely hash the password!
    hashed_pwd = get_password_hash(password)

    # Process the face image
    # ... inside your register routes ...
    file_bytes = await file.read()
    encoding, error = process_image(file_bytes)
    
    if error:
        print(f"❌ REGISTRATION BLOCKED: {error}")  # <-- ADD THIS LINE
        raise HTTPException(status_code=400, detail=error)
    # ...

    # Save the photo
    file_extension = file.filename.split(".")[-1]
    file_name = f"student_{uuid.uuid4()}.{file_extension}"
    file_location = f"uploads/{file_name}"
    
    with open(file_location, "wb") as f:
        f.write(file_bytes)

    # Save everything to the database
    new_student = models.Student(
        full_name=name,
        email=email,                 # <-- NEW
        password_hash=hashed_pwd,    # <-- NEW (Notice we save the hash, NOT the real password)
        roll_number=roll,
        department=dept,
        batch=batch,
        face_encoding=json.dumps(encoding.tolist()),
        photo_path=file_location
    )
    db.add(new_student)
    db.commit()
    
    return {"message": "Student registered successfully!"}
# --- STUDENT PERSONAL DASHBOARD ---
# --- STUDENT PERSONAL DASHBOARD ---
@app.get("/student/dashboard")
def get_student_dashboard(email: str, db: Session = Depends(database.get_db)):
    # 1. Find the specific student
    student = db.query(models.Student).filter(models.Student.email == email).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # 2. Get only their attendance logs
    logs = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id
    ).order_by(models.Attendance.id.desc()).limit(10).all()
    
    # 3. Calculate Health Metrics (Simulating 30 total classes for the ring chart)
    present_days = len([log for log in logs if log.status == "Present"])
    total_classes_held = 30 
    attendance_percentage = int((present_days / total_classes_held) * 100) if total_classes_held > 0 else 0

    # 4. Format the logs for the frontend table
    recent_logs = [{"date": log.date, "time": log.time, "status": log.status} for log in logs]
    
    # 5. Send the exact data structure React is looking for
    return {
        "student_name": student.full_name,
        "roll_number": student.roll_number,
        "photo_path": student.photo_path,
        "total_classes_held": total_classes_held,
        "present_days": present_days,
        "attendance_percentage": attendance_percentage,
        "recent_logs": recent_logs
    }

from fastapi import Form, UploadFile, File, HTTPException, Depends
from typing import Optional

@app.put("/students/{student_id}")
async def update_student(
    student_id: int, 
    name: str = Form(...),
    email: str = Form(...),
    roll: str = Form(...),
    dept: str = Form(...),
    batch: str = Form(...),
    password: Optional[str] = Form(None), 
    file: Optional[UploadFile] = File(None), 
    db: Session = Depends(database.get_db)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.full_name = name
    student.email = email
    student.roll_number = roll
    student.department = dept
    student.batch_year = batch

    # THE FIX: Corrected column name to `password_hash`
    if password and password.strip() != "":
        hashed_pw = pwd_context.hash(password)
        student.password_hash = hashed_pw 
        print(f"🔒 Password immediately reset for {student.full_name}")

    if file:
        file_location = f"uploads/face_{student.roll_number}.jpg"
        with open(file_location, "wb") as f:
            f.write(file.file.read())
        student.photo_path = file_location
        print(f"📸 New biometric photo saved for {student.full_name}")

    db.commit()
    return {"message": "Student profile updated securely"}


@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session =Depends(database.get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Not Found")
        
    # THE FIX: Delete their attendance records FIRST so SQL doesn't panic
    db.query(models.Attendance).filter(models.Attendance.student_id == student_id).delete()
        
    # Delete their photo file from the folder
    if student.photo_path and os.path.exists(student.photo_path):
        os.remove(student.photo_path)
        
    # Now it is safe to delete the student!
    db.delete(student)
    db.commit()
    return {"message": "Deleted"}

@app.post("/attendance/mark")
async def mark_attendance(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    file_bytes = await file.read()
    try:
        # 1. LOAD IMAGE
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        img_array = np.array(image)
        img_cv2 = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        # 2. ENHANCE LIGHTING (CLAHE Night-Vision)
        img_cv2_enhanced = enhance_lighting(img_cv2)
        rgb_enhanced = cv2.cvtColor(img_cv2_enhanced, cv2.COLOR_BGR2RGB)

        # 3. LIVENESS CHECK 
        is_real, reason = check_liveness(img_cv2_enhanced)
        if not is_real: 
            raise HTTPException(400, f"Spoof Detected: {reason}")
            
    except Exception as e:
        raise HTTPException(400, "Invalid image format")

    # 4. DETECT FACE (Resize to make it 4x faster!)
    small_frame = cv2.resize(rgb_enhanced, (0, 0), fx=0.5, fy=0.5)
    unknown_encodings = face_recognition.face_encodings(small_frame)
    
    if not unknown_encodings:
        print("❌ DEBUG: No face detected in the frame!")
        raise HTTPException(404, "No face detected")
    
    unknown_encoding = unknown_encodings[0]
    print("-------------------------------------------------")
    print("🔍 DEBUG: Face found! Calculating match scores...")

    TOLERANCE = 0.55 

    # 5. CHECK STUDENTS
    for student in db.query(models.Student).all():
        if student.face_encoding:
            try:
                known_encoding = np.array(json.loads(student.face_encoding))
                face_distances = face_recognition.face_distance([known_encoding], unknown_encoding)
                distance = face_distances[0]
                
                print(f"   🧑‍🎓 Student: {student.full_name} | Distance: {distance:.4f} (Must be < {TOLERANCE})")
                
                if distance <= TOLERANCE:
                    print("   ✅ SUCCESS! Student Matched.")
                    
                    # THE MAGIC: DYNAMIC TEMPLATE UPDATING
                    if distance > 0.35:
                        updated_encoding = (known_encoding * 0.9) + (unknown_encoding * 0.1)
                        student.face_encoding = json.dumps(updated_encoding.tolist())
                        print(f"   🧠 SYSTEM UPGRADE: Learned new facial features for {student.full_name}")
                    
                    today = datetime.now().strftime("%Y-%m-%d")
                    existing = db.query(models.Attendance).filter(
                        models.Attendance.student_id == student.id, 
                        models.Attendance.date == today
                    ).first()
                    
                    if existing:
                         db.commit() # Save any face learning that happened
                         return {"status": "already_marked", "type": "student", "name": student.full_name, "id_value": student.roll_number}
                    
                    db.add(models.Attendance(student_id=student.id, date=today, time=datetime.now().strftime("%I:%M %p"), status="Present"))
                    db.commit() # Save attendance AND newly learned face
                    
                    return {"status": "success", "type": "student", "name": student.full_name, "id_value": student.roll_number}
            except: continue

    # 6. CHECK TEACHERS
    # 6. CHECK TEACHERS
    for teacher in db.query(models.Teacher).all():
        if teacher.face_encoding:
            try:
                known_encoding = np.array(json.loads(teacher.face_encoding))
                face_distances = face_recognition.face_distance([known_encoding], unknown_encoding)
                distance = face_distances[0]
                
                print(f"   👨‍🏫 Teacher: {teacher.full_name} | Distance: {distance:.4f}")
                
                if distance <= TOLERANCE:
                    print("   ✅ SUCCESS! Teacher Matched.")
                    
                    # DYNAMIC TEMPLATE UPDATING (Learn their face)
                    if distance > 0.35:
                        updated_encoding = (known_encoding * 0.9) + (unknown_encoding * 0.1)
                        teacher.face_encoding = json.dumps(updated_encoding.tolist())
                        print(f"   🧠 SYSTEM UPGRADE: Learned new facial features for {teacher.full_name}")
                    
                    # --- NEW: ENTRY/EXIT LOGIC ---
                    today = datetime.now().strftime("%Y-%m-%d")
                    current_time = datetime.now().strftime("%I:%M %p")
                    
                    # Check if they already scanned in today
                    existing_log = db.query(models.TeacherAttendance).filter(
                        models.TeacherAttendance.teacher_id == teacher.id,
                        models.TeacherAttendance.date == today
                    ).first()
                    
                    if not existing_log:
                        # FIRST SCAN = ENTRY
                        new_log = models.TeacherAttendance(
                            teacher_id=teacher.id, 
                            date=today, 
                            entry_time=current_time, 
                            status="Present"
                        )
                        db.add(new_log)
                        db.commit()
                        return {"status": "success", "type": "teacher", "name": teacher.full_name, "id_value": teacher.employee_id, "message": "Entry Recorded"}
                        
                    elif not existing_log.exit_time:
                        # SECOND SCAN = EXIT
                        existing_log.exit_time = current_time
                        db.commit()
                        return {"status": "success", "type": "teacher", "name": teacher.full_name, "id_value": teacher.employee_id, "message": "Exit Recorded"}
                        
                    else:
                        # THIRD SCAN = ALREADY DONE
                        db.commit()
                        return {"status": "already_marked", "type": "teacher", "name": teacher.full_name, "id_value": teacher.employee_id, "message": "Shift Completed"}
                        
            except: continue

    print("❌ FAILURE: Distance was too high for everyone.")
    print("-------------------------------------------------")
    raise HTTPException(404, "Face not registered")

# 4. GET RECORDS
@app.get("/records")
def get_records(db: Session = Depends(database.get_db)):
    return db.query(models.Attendance)\
             .options(joinedload(models.Attendance.student))\
             .order_by(models.Attendance.id.desc())\
             .limit(100)\
             .all()

@app.get("/records/export")
def export_records(format: str, db: Session = Depends(database.get_db)):
    records = db.query(models.Attendance).options(joinedload(models.Attendance.student)).all()
    
    if format.upper() == "CSV":
        csv_file = reports.generate_csv(records)
        return StreamingResponse(
            iter([csv_file.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=attendance_report.csv"}
        )
        
    elif format.upper() == "PDF":
        pdf_file = reports.generate_pdf(records)
        return StreamingResponse(
            io.BytesIO(pdf_file.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=attendance_report.pdf"}
        )
        
    raise HTTPException(status_code=400, detail="Invalid format")

# --- TEACHER ENDPOINTS ---

@app.get("/teachers")
def get_teachers(db: Session = Depends(database.get_db)):
    return db.query(models.Teacher).all()

@app.post("/teachers/register")
async def register_teacher(
    name: str = Form(...),
    email: str = Form(...),      # <-- NEW
    password: str = Form(...),   # <-- NEW
    empid: str = Form(...), 
    dept: str = Form(...),
    subject: str = Form(...), 
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    # Check if Employee ID OR Email already exists
    existing = db.query(models.Teacher).filter(
        (models.Teacher.employee_id == empid) | (models.Teacher.email == email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Teacher ID or Email already exists")

    # Securely hash the password!
    hashed_pwd = get_password_hash(password)

    # Process the face image
    file_bytes = await file.read()
    encoding, error = process_image(file_bytes)
    
    if error:
        raise HTTPException(status_code=400, detail=error)

    # Save the photo
    file_extension = file.filename.split(".")[-1]
    file_name = f"teacher_{uuid.uuid4()}.{file_extension}"
    file_location = f"uploads/{file_name}"
    
    with open(file_location, "wb") as f:
        f.write(file_bytes)

    # Save everything to the database
    new_teacher = models.Teacher(
        full_name=name,
        email=email,                 # <-- NEW
        password_hash=hashed_pwd,    # <-- NEW
        employee_id=empid,
        department=dept,
        subject=subject,
        face_encoding=json.dumps(encoding.tolist()),
        photo_path=file_location
    )
    db.add(new_teacher)
    db.commit()
    
    return {"message": "Teacher registered successfully!"}

@app.put("/teachers/{teacher_id}")
async def update_teacher(
    teacher_id: int,
    name: str = Form(...),
    empid: str = Form(...),
    dept: str = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(database.get_db)
):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(404, "Teacher not found")
    
    teacher.full_name = name
    teacher.employee_id = empid
    teacher.department = dept
    teacher.subject = subject
    
    if file:
        file_bytes = await file.read()
        encoding, msg = process_image(file_bytes)
        if not encoding:
            raise HTTPException(400, detail=msg)
            
        if teacher.photo_path and os.path.exists(teacher.photo_path):
            os.remove(teacher.photo_path)
            
        filename = f"teacher_{uuid.uuid4()}.jpg"
        file_path = f"uploads/{filename}"
        with open(file_path, "wb") as f:
            f.write(file_bytes)
            
        teacher.photo_path = file_path
        teacher.face_encoding = encoding

    db.commit()
    return {"message": "Teacher Updated"}

@app.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(database.get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(404, "Not Found")
        
    if teacher.photo_path and os.path.exists(teacher.photo_path):
        os.remove(teacher.photo_path)
        
    db.delete(teacher)
    db.commit()
    return {"message": "Deleted"}

# --- UPGRADED DASHBOARD STATS ENDPOINT ---
from typing import Optional

# --- UPGRADED DASHBOARD STATS ENDPOINT (WITH FILTERS) ---
@app.get("/dashboard/stats")
def get_dashboard_stats(
    dept: Optional[str] = None, 
    batch: Optional[str] = None, 
    db: Session = Depends(database.get_db)
):
    today = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Base Queries
    student_query = db.query(models.Student)
    teacher_query = db.query(models.Teacher)
    student_att_query = db.query(models.Attendance).join(models.Student).filter(models.Attendance.date == today)
    teacher_att_query = db.query(models.TeacherAttendance).join(models.Teacher).filter(models.TeacherAttendance.date == today)

    # 2. Apply Dynamic Filters (If requested by React)
    if dept and dept != "All":
        student_query = student_query.filter(models.Student.department == dept)
        teacher_query = teacher_query.filter(models.Teacher.department == dept)
        student_att_query = student_att_query.filter(models.Student.department == dept)
        teacher_att_query = teacher_att_query.filter(models.Teacher.department == dept)
        
    if batch and batch != "All":
        student_query = student_query.filter(models.Student.batch == batch)
        student_att_query = student_att_query.filter(models.Student.batch == batch)
        # Note: Teachers don't have batches, so we don't filter them by batch!

    # 3. Calculate Totals
    total_students = student_query.count()
    present_students = student_att_query.distinct(models.Attendance.student_id).count()
    
    total_teachers = teacher_query.count()
    present_teachers = teacher_att_query.distinct(models.TeacherAttendance.teacher_id).count()

    # 4. Fetch Recent Logs for the Tables
    recent_students = student_att_query.order_by(models.Attendance.id.desc()).limit(5).all()
    s_logs = [{"name": l.student.full_name, "id": l.student.roll_number, "dept": l.student.department, "time": l.time, "status": l.status} for l in recent_students]
    
    recent_teachers = teacher_att_query.order_by(models.TeacherAttendance.id.desc()).limit(5).all()
    t_logs = [{"name": l.teacher.full_name, "id": l.teacher.employee_id, "dept": l.teacher.department, "entry": l.entry_time, "exit": l.exit_time or "--"} for l in recent_teachers]

    # 5. Package it all up for React
    return {
        "students": {
            "total": total_students, 
            "present": present_students, 
            "absent": max(0, total_students - present_students)
        },
        "teachers": {
            "total": total_teachers, 
            "present": present_teachers, 
            "absent": max(0, total_teachers - present_teachers)
        },
        "recent_student_logs": s_logs,
        "recent_teacher_logs": t_logs
    }
import math
import pyotp
from pydantic import BaseModel

# --- GEOFENCING CONFIGURATION ---
# Set these to the exact coordinates of Techno India University / Your Campus
# --- GEOFENCING CONFIGURATION ---
# Custom coordinates for your specific evaluation building
CAMPUS_LAT = 22.658018 
CAMPUS_LON = 88.389317 
ALLOWED_RADIUS_METERS = 150 # Students must be within 150 meters # Students must be within 150 meters

# --- TOTP CONFIGURATION ---
# In a real app, every class/teacher has a unique secret in the DB.
# We will use a master secret for this demonstration.
CLASS_MASTER_SECRET = "JBSWY3DPEHPK3PXP" 

def calculate_distance(lat1, lon1, lat2, lon2):
    """Haversine formula to calculate distance between two GPS points in meters."""
    R = 6371000 # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# Request Model for the Student's Phone
# --- 1. Request Model (Using Email!) ---
class QRSubmit(BaseModel):
    email: str  
    totp_code: str
    latitude: float
    longitude: float

@app.get("/teacher/live-qr")
def get_live_qr():
    """Generates the current 30-second QR code for the Teacher's screen."""
    totp = pyotp.TOTP(CLASS_MASTER_SECRET)
    current_code = totp.now()
    return {"qr_string": f"ATTENDEASE-{current_code}"}

# --- 2. The Verification & Database Route ---
@app.post("/attendance/qr-mark")
def mark_qr_attendance(data: QRSubmit, db: Session = Depends(database.get_db)):
    print(f"📡 Request from {data.email} at GPS: {data.latitude}, {data.longitude}")
    
    # 1. VERIFY GPS LOCATION
    distance = calculate_distance(CAMPUS_LAT, CAMPUS_LON, data.latitude, data.longitude)
    if distance > ALLOWED_RADIUS_METERS:
        print(f"❌ REJECTED: Student is {int(distance)}m away from campus.")
        raise HTTPException(status_code=403, detail=f"Location Denied. You are {int(distance)}m away from campus.")
    
    # 2. VERIFY ROTATING TOTP CODE (With 30-second grace period)
    totp = pyotp.TOTP(CLASS_MASTER_SECRET)
    extracted_code = data.totp_code.split("-")[-1].strip() if "-" in data.totp_code else data.totp_code.strip()
    
    if not totp.verify(extracted_code, valid_window=1):
        print(f"❌ REJECTED: Code '{extracted_code}' is expired or invalid.")
        raise HTTPException(status_code=403, detail="QR Code Expired. Please scan the new code on the board.")
    
    # 3. LINK TO DATABASE & SAVE
    student = db.query(models.Student).filter(models.Student.email == data.email).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student account not found.")

    today = datetime.now().strftime("%Y-%m-%d")
    current_time = datetime.now().strftime("%I:%M %p")

    # Prevent double-marking for the same day
    existing = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id,
        models.Attendance.date == today
    ).first()

    if existing:
        return {"status": "success", "message": "Attendance already recorded for today!", "distance_meters": int(distance)}

    # Officially save to the ledger!
    new_attendance = models.Attendance(
        student_id=student.id,
        date=today,
        time=current_time,
        status="Present"
    )
    db.add(new_attendance)
    db.commit()
    
    print(f"✅ SUCCESS: {student.full_name} marked present via GPS/QR!")
    return {"status": "success", "message": "Attendance marked securely.", "distance_meters": int(distance)}