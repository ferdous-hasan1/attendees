from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)      # <-- NEW
    password_hash = Column(String)                       # <-- NEW
    roll_number = Column(String, unique=True, index=True)
    department = Column(String)
    batch = Column(String)
    face_encoding = Column(String)
    photo_path = Column(String)

    attendance_logs = relationship("Attendance", back_populates="student")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    date = Column(String)
    time = Column(String)
    status = Column(String)

    student = relationship("Student", back_populates="attendance_logs")

# --- TEACHER TABLE ---
class Teacher(Base):
    __tablename__ = "teachers"  

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)      # <-- NEW
    password_hash = Column(String)                       # <-- NEW
    employee_id = Column(String, unique=True, index=True)
    department = Column(String)
    subject = Column(String)
    photo_path = Column(String)
    face_encoding = Column(String)
    # --- NEW: TEACHER ATTENDANCE LOG ---
class TeacherAttendance(Base):
    __tablename__ = "teacher_attendance"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    date = Column(String)
    entry_time = Column(String)
    exit_time = Column(String, nullable=True) # Starts empty until they leave!
    status = Column(String)

    # Link it back to the Teacher table
    teacher = relationship("Teacher")