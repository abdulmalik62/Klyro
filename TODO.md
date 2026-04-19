# Student Class Assignment Integration - TODO
c    Current Working Directory: c:/Users/paabd/Documents/projects/edu_connect/Klyro

## Approved Plan Steps (In Order):

### 1. Update types/index.ts
- Add `classId?: string | null;` to Student interface.

### 2. Update StudentManagement.tsx
#### 2a. Imports & State
- Import classService, teacherService, Class type.
- Add states: classes[], teachers[], availableClasses[], selectedClassId.
- Add teacherMap to useMemo.

#### 2b. Subscriptions
- Add classService.subscribe(setClasses), teacherService.subscribe(setTeachers) in main useEffect.

#### 2c. Helpers & useEffect
- Add getAvailableClasses(subjectIds, sessionIds) filter function.
- Add getClassDisplay(cls) for card info.
- useEffect on [formData.subjectIds, formData.sessionIds] → setAvailableClasses.

#### 2d. Modal UI - Insert Section
- After "Our Enrollment" section, before Declaration.
- New "Assign Class" section with header, "Assign Later" btn.
- Conditional content: empty states, class cards.
- Cards: styling, info, Assign btn → setSelectedClassId(cls.id).

#### 2e. Form Loading (Edit)
- In openModal if editingStudent.classId → setSelectedClassId.

#### 2f. Submission
- studentData → add classId: selectedClassId || null.
- **Advanced**: If classId, update class.studentIds.push(student.id), classService.update.

#### 2g. Preserve
- All existing logic intact.

## Progress Tracking:
- [x] Step 1: types/index.ts ✅
- [x] Step 2a: Imports/State ✅
- [x] Step 2b: Subscriptions ✅
- [x] Step 2c: Helpers/useEffect ✅
- [x] Step 2d: UI Section ✅
- [x] Step 2e: Edit Loading ✅
- [x] Step 2f: Submission (incl. Advanced) ✅
- [x] Step 2g: Verified no breakage ✅

All steps completed successfully!

## Next Steps:
Implement Step 2f: Update handleSubmit to save classId, advanced auto-update class.studentIds.

## Next Steps:
Implement Step 2d: "Assign Class" UI section after Enrollment, before Declaration.

## Next: Testing
1. npm run dev
2. Go to Students → Add Student
3. Select subjects/sessions → Verify filtered classes appear
4. Select class → Submit → Check data
5. Edit existing → Verify pre-select

