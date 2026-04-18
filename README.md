# 🎓 AcadGrid — Student Attendance & Academic Management Platform


---

## 🚀 Overview

**AcadGrid** is a modern SaaS-ready platform designed for tuition centers and educational institutes to manage:

* Student records
* Attendance tracking
* Academic configurations (Subjects, Sessions, Grades)
* Teacher management
* Parent communication

The system is built with a scalable architecture to evolve into a full SaaS product while currently supporting standalone deployments for individual institutes.

---

## 🎯 Project Scope

AcadGrid aims to simplify and digitize the daily operations of educational institutes by providing:

* Centralized student and academic data management
* Structured subject, session, and grade configuration
* Flexible student enrollment into subjects and sessions
* Real-time attendance tracking
* Clean and modern dashboard experience for admins and teachers

---

## 👥 User Roles

* **Owner**

  * Full system access
  * Manage students, teachers, academic setup
  * View reports and analytics

* **Teacher**

  * Mark attendance
  * Manage class activities
  * Send updates to parents

* **Parent**

  * View student profile
  * Track attendance records

---

## 🧩 Core Features

### 📚 Academic Configuration

* Manage **Subjects**, **Sessions**, and **Grades**
* Tab-based UI with:

  * Search functionality
  * Table & Card view toggle
  * Full CRUD operations

---

### 👨‍🏫 Teacher Management

* Add and manage teachers
* Assign:

  * Major Subjects
  * Other Subjects (linked to system subjects)
* Store qualification and experience

---

### 🎓 Student Management

* Detailed student profiles:

  * Personal details (parents, contact, address)
  * Academic details (grade, school, HSC group)
  * Enrollment (subjects, sessions)

* Features:

  * Search and filtering
  * Table & Card view
  * Multi-select subject and session mapping
  * Form validation and structured data handling

---

### 🧾 Attendance System

* Mark attendance by class/session
* Track:

  * Present / Absent
  * Remarks
* Integrated with student and session data

---

### 📲 Communication (WhatsApp Ready)

* Generate WhatsApp messages for:

  * Attendance updates
  * Class completion
  * Class cancellation

---

## 🏗️ Architecture Highlights

* **Frontend:** React + TypeScript (Vite)
* **UI:** Tailwind CSS + shadcn/ui
* **State Management:** React hooks & context
* **Data Layer:** Firebase-ready (currently mock/local storage)
* **Design:** Modular, scalable, SaaS-ready structure

---

## 🔥 Key Capabilities

* Clean separation of:

  * Students
  * Teachers
  * Subjects
  * Sessions
  * Grades

* Flexible data relationships:

  * Student → Subjects & Sessions
  * Teacher → Subjects
  * Future-ready Class system integration

* Modern UX:

  * Responsive design
  * Card/Table toggle views
  * Smooth animations

---

## 🧠 Future Enhancements

* Class management system (core relationship layer)
* Firebase backend integration
* Role-based authentication (production-ready)
* Analytics & reporting dashboard
* Multi-institute (SaaS) support

---

## 🛠️ Run Locally

### Prerequisites

* Node.js

### Steps

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set environment variables:
   Create a `.env.local` file and add:

   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

---

## 🌐 Deployment

This project is designed to be easily deployable and scalable into a full SaaS platform.

---

## 📌 Vision

AcadGrid is built to evolve from a **single-institute solution** into a **full-fledged SaaS platform** for educational management, combining simplicity, performance, and scalability.

---

## 🤝 Contribution

This project is currently under active development. Contributions, suggestions, and improvements are welcome.

---

## 📄 License

This project is intended for educational and commercial use. Licensing can be defined based on deployment needs.
