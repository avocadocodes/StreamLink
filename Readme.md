# **StreamLink : A Video Calling App for SuperSoul**

## 🚀 **Overview**
StreamLink is a **full-stack video calling application** similar to Google Meet, built using:
- **Frontend**: Next.js (TypeScript, Tailwind CSS)
- **Backend**: FastAPI (Python, MongoDB, WebSockets, JWT Authentication)
- **Deployment**: Vercel (Frontend), Render (Backend)

Users can:
- Start or join video meetings
- Generate shareable meeting links
- Authenticate using JWT-based login/signup
- Communicate via live chat during calls
- Manage meetings with an admin approval system

---

## 🎯 **Features**
✅ Secure **JWT Authentication** (Login & Signup)  
✅ **WebRTC Video Calls** using PeerJS  
✅ **Live Chat** in Meetings  
✅ **Admin Controls** (Approve/Deny Participants)  
✅ **Shareable Meeting Links** like Google Meet  
✅ **WebSocket-Based Real-Time Communication**  
✅ **MongoDB Integration** for Storing Meeting Data  
✅ **Deployed on Vercel (Frontend) & Render (Backend)**  

---

## 🛠 **Tech Stack**
### **Frontend** (Next.js + TypeScript)
- **React.js (Next.js)** – Server-Side Rendering (SSR)
- **TypeScript** – Strongly Typed Code
- **Tailwind CSS** – Modern UI Design
- **PeerJS** – WebRTC for Video Calls
- **Axios** – API Calls

### **Backend** (FastAPI + MongoDB)
- **FastAPI** – High-Performance API
- **WebSockets** – Real-time Communication
- **MongoDB (Motor)** – Database for Storing Meeting Data
- **JWT Authentication (python-jose, passlib, bcrypt)** – Secure Authentication
- **CORS Middleware** – Handles Cross-Origin Requests

---

## 🔧 **Installation & Setup**

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/avocadocodes/StreamLink
```

### **2️⃣ Setup Backend (FastAPI)**
```sh
cd backend
python -m venv venv  # Create Virtual Environment
source venv/bin/activate  # (For Windows: venv\Scripts\activate)
pip install -r requirements.txt  # Install Dependencies
uvicorn main:app --reload  # Run FastAPI Server
```
- **Backend Runs on**: `http://localhost:8000`

### **3️⃣ Setup Frontend (Next.js)**
```sh
cd frontend
npm install  # Install Dependencies
npm run dev  # Start Development Server
```
- **Frontend Runs on**: `http://localhost:3001`

---

## 🚀 **How to Use**
### **🔹 Start a Meeting**
1. **Login/Register** on the home page.
2. Click **“Start a New Meeting”**.
3. Share the **meeting link** with others.
4. Participants **click the link** to join.

### **🔹 Join a Meeting**
1. Click the **meeting link** or enter the **Meeting ID**.
2. If the meeting requires approval, the host will **accept your request**.
3. Start chatting & video calling!

---

## 🌐 **Deployment**
### **Frontend: Vercel**
- **Deployed URL**: [`https://streamlink-sigma.vercel.app/`](https://streamlink-sigma.vercel.app/)


---



### **WebRTC Issues (Video Not Working)**
- Ensure the correct **ICE Servers** are configured in `PeerJS`.

### **MongoDB Connection Issues**
- Update your **`.env`** file with:
```sh
DATABASE_URL=mongodb+srv://your-user:your-password@cluster.mongodb.net/video_call_db
```

---


