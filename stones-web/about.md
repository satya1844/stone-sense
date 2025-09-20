Problem Statement — AI in HealthCare
Create an AI-based diagnostic system to analyze kidney scan images and:

Detect the presence of kidney stones.
Identify the size and location of the stone.
Generate a detailed report for doctors and patients.

for this problem statement, our solution to build a webapplication for the detection of kidney stones.

vinay(me) and sankrut are working on the project ,as of now sankrut has built the model and is sucessdful to achieve te stones detection. i have cloned his git repo and createed a branch called interface where i will developing the website.

and some the features we wanna add are:
StoneSense features
Patient end: List of hospitals near their location best at dealing with kidney related problems. Provide location, contact number etc..
Patient end: add chatbot for any faqs etc
Doctor end: Pdf for the doctor should contain patient id, details etc. 
Layered reporting → first a simple statement, then details. Add visual scan with stone highlighted so they “see it” instead of guessing. 
Automatic measurement + stone count + volume calculation — AI saves radiologists’ time. 
When the AI detects potentially severe or high-risk findings, the system withholds detailed results from the patient and instead issues a clear message such as: “We cannot interpret the severity of this scan. Please consult a doctor for full details.” At the same time, the doctor receives the complete report with measurements, images, and flagged urgency. This ensures patients aren’t left anxious or misinformed, while doctors get the structured insights they need to guide treatment. 
The system allows patients to enter their doctor’s mobile number in advance. If a scan is flagged as severe, the patient only sees a safe message advising consultation, while the complete detailed report is automatically sent to the doctor’s number. This ensures sensitive findings are handled responsibly, keeps patients from misinterpreting results, and gives doctors timely, structured information to act on. 


hence now i have to build the website, for that i need to have diff pages , and also api routes, auth connections, database, etc