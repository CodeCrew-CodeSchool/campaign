Our email campaign builder is a web application that leverages natural language processing and transformer models to generate personalized, professional email sequences automatically. Designed for small business owners and creators, it simplifies campaign creation, personalization, and now direct email sending through Resend, enabling users to produce targeted marketing content efficiently.

Contributors: Bruce Brown, Kadarius Clemons


Tech Stack
Frontend:  
HTML, CSS, Vanilla JavaScript  

Backend:  
Node.js + Express  
Gemini 1.5 Flash API (AI)  
Resend API (email delivery)   

Data Science & Evaluation:
NLTK, textstat, pandas

---

Features
AI-generated 3-part email sequences
Integrated email sending with Resend
Simple one-page UI

---

Testing
Metrics used: BLEU score, Flesch Reading Ease, word count.  
Testing performed with Google Colab notebooks.


Run the AI Email Generator Locally

This is an email generator built with Node.js, Express, and the Gemini Flash API for content generation, and Resend for email delivery. It creates personalized marketing email campaigns and can send them directly to your recipients.

Prerequisites

Node.js installed (v18 or higher recommended)


A Gemini API key from Google AI Studio > https://makersuite.google.com/app/apikey


A Resend API key >  https://resend.com/api-keys



1. Clone the project

git clone https://github.com/CodeCrew-CodeSchool/campaign.git

cd your-repo-name/backend


2. Install dependencies

npm install


3. Set up your .env file

Create a file named .env inside the backend/ folder with the following:

GEMINI_API_KEY=your-real-gemini-api-key-here

RESEND_API_KEY=your-real-resend-api-key-here


You can copy the format from .env.example.

4. Run the backend server

node server.js

You should see:

Server running on http://localhost:5000


5. Open the app in your browser

Open the index.html file in your browser (located in the backend/ folder) by double-clicking it, or right-click and choose “Open with browser.”


6. Sending Emails with Resend

Once your email sequence is generated, you can now send it directly through the app using Resend. The backend securely handles the email delivery with your API key.

You’re ready to generate email campaigns!
