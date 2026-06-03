import csv
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

def generate_csv(records):
    """Creates a CSV file in memory"""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["ID", "Name", "Roll No", "Batch", "Date", "Time", "Status"])
    
    # Rows
    for record in records:
        # SAFETY CHECK: If student was deleted, show "Unknown" instead of crashing
        name = record.student.full_name if record.student else "Unknown Student"
        roll = record.student.roll_number if record.student else "N/A"
        batch = record.student.batch if record.student else "N/A"

        writer.writerow([
            record.id, 
            name, 
            roll, 
            batch,
            record.date, 
            record.time, 
            record.status
        ])
        
    output.seek(0)
    return output

def generate_pdf(records):
    """Creates a PDF file in memory"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    # Title
    styles = getSampleStyleSheet()
    elements.append(Paragraph("Attendance Report", styles['Title']))
    elements.append(Paragraph(f"Total Records: {len(records)}", styles['Normal']))
    elements.append(Paragraph("<br/><br/>", styles['Normal']))
    
    # Table Data
    data = [["Name", "Roll No", "Batch", "Date", "Time", "Status"]] # Header
    
    for r in records:
        # SAFETY CHECK here too
        name = r.student.full_name if r.student else "Unknown"
        roll = r.student.roll_number if r.student else "N/A"
        batch = r.student.batch if r.student else "N/A"

        data.append([
            name, 
            roll, 
            batch,
            r.date, 
            r.time, 
            r.status
        ])
        
    # Table Styling
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer