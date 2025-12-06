# Exam CSV Template - Bilingual Format

## Overview
This CSV template allows you to create exams with full English and Arabic language support. Use this template to upload new exams through the Admin Dashboard.

## ⚠️ Security Notice
**IMPORTANT:** Before deploying to production:
1. **Change default admin password** (`admin/admin123`) immediately after first login
2. **Set SESSION_SECRET environment variable** to a strong random value
3. The system will warn you if SESSION_SECRET is not set

## Template Location
- **File:** `exam-template.csv`
- **Format:** CSV (Comma-Separated Values)
- **Encoding:** UTF-8

## Column Structure

### Required Columns (Bilingual Format)

| Column Name | Description | Example |
|------------|-------------|---------|
| `id` | Question ID (numeric) | 1, 2, 3... |
| `type` | Question type | `single` or `multiple` |
| `question_en` | Question text (English) | What is the primary purpose... |
| `question_ar` | Question text (Arabic) | ما هو الهدف الأساسي... |
| `optionA_en` | Option A (English) | To document the project budget |
| `optionA_ar` | Option A (Arabic) | لتوثيق ميزانية المشروع |
| `optionB_en` | Option B (English) | To formally authorize... |
| `optionB_ar` | Option B (Arabic) | للترخيص الرسمي... |
| `optionC_en` | Option C (English) | To list all stakeholders |
| `optionC_ar` | Option C (Arabic) | لسرد جميع أصحاب المصلحة |
| `optionD_en` | Option D (English) | To define the schedule |
| `optionD_ar` | Option D (Arabic) | لتحديد الجدول الزمني |
| `correctAnswer` | Answer for single-choice (A, B, C, or D) | B |
| `correctAnswers` | Answers for multiple-choice (space/comma separated) | A C |
| `minSelections` | Min answers for multiple-choice | 2 |
| `maxSelections` | Max answers for multiple-choice | 4 |
| `explanation_en` | Explanation (English) | The project charter... |
| `explanation_ar` | Explanation (Arabic) | يقوم ميثاق المشروع... |
| `domain_en` | Domain (English) | Process, People, Business Environment |
| `domain_ar` | Domain (Arabic) | العمليات, الأفراد, بيئة الأعمال |

## Question Types

### Single-Answer Questions
- Set `type` = `single`
- Fill `correctAnswer` with A, B, C, or D
- Leave `correctAnswers`, `minSelections`, `maxSelections` empty

### Multiple-Answer Questions
- Set `type` = `multiple`
- Fill `correctAnswers` with space or comma-separated letters (e.g., "A C" or "A, C")
- Set `minSelections` (minimum answers user must select, typically 2)
- Set `maxSelections` (maximum answers user can select, typically 4)
- Leave `correctAnswer` empty

## Upload Instructions

1. **Login to Admin Dashboard**
   - Navigate to `/admin/login`
   - Default credentials: username `admin`, password `admin123`

2. **Go to Upload Page**
   - Click "Upload Exams" from the dashboard
   - Or navigate to `/admin/upload`

3. **Fill Exam Details**
   - Enter exam title (e.g., "PMP Practice Exam")
   - Optionally add description

4. **Select CSV File**
   - Click "Select File" and choose your CSV file
   - The system will show a preview of the file content

5. **Upload**
   - Click "Upload Exam"
   - The system will parse, validate, and save the exam
   - You'll see a success message with the question count

## CSV Formatting Tips

### Handling Commas in Text
If your text contains commas, wrap the entire field in double quotes:
```csv
"Question with, commas in it","سؤال مع، فواصل فيه"
```

### Arabic Text
- Ensure your CSV file is saved with UTF-8 encoding
- Arabic text should flow naturally right-to-left in your editor
- The application will automatically handle RTL display

### Empty Fields
- For optional fields (like optionD in 3-option questions), leave blank or use placeholder text
- Arabic placeholders will be auto-generated with `[AR]` prefix if left empty

## Example Rows

See `exam-template.csv` for complete examples including:
- Single-answer question (Question 1)
- Multiple-answer question (Question 2)
- Various domain types (Process, People, Business Environment)

## Common Domains

**English:**
- Process
- People
- Business Environment

**Arabic:**
- العمليات (Process)
- الأفراد (People)
- بيئة الأعمال (Business Environment)

## Troubleshooting

### Upload Fails
- Check that all required columns are present
- Verify CSV encoding is UTF-8
- Ensure `correctAnswer` uses letters (A, B, C, D) not numbers
- For multiple-choice, verify you have at least 2 correct answers

### Questions Missing
- Check that `question_en` column has text
- Verify question IDs are unique
- Empty rows will be automatically skipped

### Arabic Not Displaying
- Confirm CSV file encoding is UTF-8
- Check that Arabic columns (`*_ar`) contain Arabic text
- The application handles RTL layout automatically

## Need Help?
Contact your system administrator or refer to the application documentation.
