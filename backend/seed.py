import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Import models
import models

# 1. DELETE EXISTING DB
db_path = "backend/attendance.db"
if os.path.exists(db_path):
    os.remove(db_path)
    print("Old database removed.")

# 2. CREATE NEW DB
DATABASE_URL = "sqlite:///./backend/attendance.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
models.Base.metadata.create_all(bind=engine)
print("New database created.")

# 3. SETUP SESSION & HASHING
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password):
    return pwd_context.hash(password)

common_hash = get_password_hash("1234")

# 4. SEED TEACHERS
teachers = [
    models.Teacher(full_name="Dr. Sarah Jenkins", email="sarah.jenkins@technoindia.com", password_hash=common_hash, employee_id="EMP-1001", department="Computer Science", subject="Data Structures"),
    models.Teacher(full_name="Prof. Alan Turing", email="alan.turing@technoindia.com", password_hash=common_hash, employee_id="EMP-1002", department="Mathematics", subject="Discrete Math"),
    models.Teacher(full_name="Dr. Grace Hopper", email="grace.hopper@technoindia.com", password_hash=common_hash, employee_id="EMP-1003", department="Computer Science", subject="Compilers")
]
db.add_all(teachers)

# 5. SEED STUDENTS
students = [
    models.Student(full_name="Alice Smith", email="alice.smith@student.com", password_hash=common_hash, roll_number="CS-2024-001", department="Computer Science", batch="2024"),
    models.Student(full_name="Bob Jones", email="bob.jones@student.com", password_hash=common_hash, roll_number="CS-2024-002", department="Computer Science", batch="2024"),
    models.Student(full_name="Charlie Brown", email="charlie.brown@student.com", password_hash=common_hash, roll_number="ME-2025-015", department="Mechanical", batch="2025")
]
db.add_all(students)

db.commit()
print("Database successfully seeded with new employees and students.")
