Our email campaign builder is a web application that leverages natural language processing and transformer models to generate personalized, professional email sequences automatically. Designed for small business owners and creators, it simplifies campaign creation and personalization, enabling users to produce targeted marketing content efficiently.


Bruce Brown, Kadarius Clemons


 Run the AI Email Generator Locally

This is an email generator built with Node.js, Express, and the Gemini Flash API. It creates personalized marketing email campaigns for any business.

 Prerequisites

Node.js installed (v18 or higher recommended)


A Gemini API key from Google AI Studio > https://makersuite.google.com/app/apikey



 1. Clone the project

git clone https://github.com/CodeCrew-CodeSchool/campaign.git

cd your-repo-name/backend


2. Install dependencies

npm install


 3. Set up your .env file

Create a file named .env inside the backend/ folder:

GEMINI_API_KEY=your-real-gemini-api-key-here

You can copy the format from .env.example.

 4. Run the backend server

node server.js

You should see:

Server running on http://localhost:5000


 5. Open the app in your browser

Open the index.html file in your browser (located in the backend/ folder) by double-clicking it, or right-click and choose “Open with browser.”

You’re ready to generate email campaigns!
