import yaml
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import logging
from openai import OpenAI
import glob
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise Exception("Set your OPENAI_API_KEY in the .env file!")

client = OpenAI(api_key=api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI Patient API running."}

# Request models με session_id
class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    message: str
    scenario: str

class FeedbackRequest(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    scenario: str
    history: List[Dict[str, str]]  # [{role: "user"/"assistant", content: "..."}]

def load_scenarios():
    scenarios = {}
    yaml_files = glob.glob("scenarios/*.yaml")
    for filepath in yaml_files:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                case_id = data.get("case_id") or os.path.splitext(os.path.basename(filepath))[0]
                scenarios[case_id] = data
                logging.info(f"✅ Loaded scenario: {case_id}")
        except Exception as e:
            logging.error(f"❌ Failed to load {filepath}: {e}")
    return scenarios

scenarios = load_scenarios()

# conversation_histories[session_id][scenario_id] = [messages]
conversation_histories: Dict[str, Dict[str, List[Dict[str, str]]]] = {}

@app.get("/scenarios")
async def get_scenarios():
    result = []
    for scenario_id, data in scenarios.items():
        title = data.get("title") or scenario_id.replace("_", " ").title()
        result.append({"id": scenario_id, "title": title})
    return JSONResponse(content=result)

@app.post("/chat")
async def chat(request: ChatRequest):
    scenario_id = request.scenario
    session_id = request.session_id
    scenario = scenarios.get(scenario_id)

    if not scenario:
        raise HTTPException(status_code=400, detail=f"Scenario '{scenario_id}' not found.")

    if session_id not in conversation_histories:
        conversation_histories[session_id] = {}

    if scenario_id not in conversation_histories[session_id]:
        conversation_histories[session_id][scenario_id] = []

    conversation_history = conversation_histories[session_id][scenario_id]

    try:
        student_message = request.message
        logging.info(f"[{scenario_id}][{session_id}] Student: {student_message}")

        conversation_history.append({"role": "user", "content": student_message})

        ai_prompt = scenario.get("ai_prompt")
        if not ai_prompt:
            raise HTTPException(status_code=500, detail=f"Scenario '{scenario_id}' missing 'ai_prompt'.")

        messages = [{"role": "system", "content": ai_prompt}] + conversation_history

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=500,
            temperature=0.8
        )
       
        ai_reply = response.choices[0].message.content.strip()
        conversation_history.append({"role": "assistant", "content": ai_reply})

        logging.info(f"[{scenario_id}][{session_id}] AI Reply: {ai_reply[:60]}...")

        return {"reply": ai_reply}

    except Exception as e:
        logging.error(f"🔥 Error in /chat [{scenario_id}][{session_id}]: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@app.post("/feedback")
async def get_feedback(request: FeedbackRequest):
    try:
        history_formatted = "\n".join(
            f"{'Νοσηλευτής' if m['role'] == 'user' else 'Ασθενής'}: {m['content']}" for m in request.history
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "Είσαι ένας έμπειρος και ευγενικός κλινικός αξιολογητής. "
                    "Αναλύεις συνομιλίες μεταξύ νοσηλευτή (user) και ασθενούς (assistant) "
                    "και δίνεις ήπια, ζεστή, ανθρώπινη και εκπαιδευτική ανατροφοδότηση στον νοσηλευτή. "
                    "Επισημαίνεις τι πήγε καλά, τι χρειάζεται βελτίωση και πώς μπορεί να γίνει πιο αποτελεσματικός στο μέλλον. "
                    "Εάν ο νοσηλευτής εκφράζεται απότομα, ειρωνικά ή ακατάλληλα, εξηγείς γιατί αυτό δεν είναι σωστό. "
                    "Αντίστοιχα, αν ο ασθενής είναι δύσκολος ή αγενής, δείχνεις τρόπους διαχείρισης με επαγγελματισμό. "
                    "Η ανατροφοδότηση πρέπει να είναι σε φυσικά ελληνικά, χωρίς bullets ή τίτλους, σαν να μιλάς απευθείας στον φοιτητή με σεβασμό."
                )
            },
            {
                "role": "user",
                "content": f"Ανατροφοδότησε τον νοσηλευτή με βάση την παρακάτω συνομιλία:\n\n{history_formatted}"
            }
        ]

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=800,
            temperature=0.5
        )

        feedback = response.choices[0].message.content.strip()
        return {"feedback": feedback}

    except Exception as e:
        logging.error(f"🔥 Error in /feedback: {e}")
        raise HTTPException(status_code=500, detail="Error generating feedback.")
    
from random import uniform, choice, randint

class PhysicalExamRequest(BaseModel):
    session_id: str
    scenario: str

async def get_ai_generated_exam(prompt: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Είσαι ένας βοηθός νοσηλευτικής εκπαίδευσης."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"🔥 AI exam generation error: {e}")
        return "Σφάλμα AI"

import json  # Βεβαιώσου ότι είναι στην αρχή του αρχείου

@app.post("/physical_exam")
async def physical_exam(request: PhysicalExamRequest):
    scenario_id = request.scenario
    scenario = scenarios.get(scenario_id)

    if not scenario:
        raise HTTPException(status_code=400, detail="Scenario not found.")

    scenario_yaml = yaml.dump(scenario, allow_unicode=True)
    prompt = (
        "Με βάση το παρακάτω σενάριο ασθενούς σε YAML, γράψε τα αποτελέσματα της ΦΥΣΙΚΗΣ ΕΞΕΤΑΣΗΣ σε JSON μορφή, "
        "με τα εξής πεδία: temperature_celsius, blood_pressure_mmHg (που έχει subfields systolic και diastolic), "
        "pulse_bpm, oxygen_saturation_percent, neurological_status (consciousness_level, orientation, dizziness), "
        "musculoskeletal_system (pain_location, mobility, muscle_strength, swelling, bruising), "
        "skin_condition (color, temperature), psychological_state (emotional_state, cooperation). "
        "Δώσε μόνο το JSON, χωρίς επιπλέον κείμενο ή εξηγήσεις.\n\n"
        f"{scenario_yaml}"
    )

    result_text = await get_ai_generated_exam(prompt)
    result_text = result_text.strip()

    # Αν αρχίζει και τελειώνει με ```json ... ```
    if result_text.startswith("```"):
        result_text = result_text.strip("`").strip()
        if result_text.lower().startswith("json"):
            result_text = result_text[4:].strip()

    logging.info(f"Cleaned AI response:\n{result_text}")

    try:
        result_json = json.loads(result_text)
    except json.JSONDecodeError as e:
        logging.error(f"JSON decode error in physical_exam: {e}")
        raise HTTPException(status_code=500, detail="AI response JSON decode error.")

    return JSONResponse(content=result_json)

class DiagnosticTestsRequest(BaseModel):
    session_id: str
    scenario: str


from fastapi import HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import yaml

class DiagnosticTestsRequest(BaseModel):
    session_id: str
    scenario: str

@app.post("/diagnostic_tests")
async def diagnostic_tests(request: DiagnosticTestsRequest):
    scenario_id = request.scenario
    scenario = scenarios.get(scenario_id)

    if not scenario:
        raise HTTPException(status_code=400, detail="Scenario not found.")

    scenario_yaml = yaml.dump(scenario, allow_unicode=True)

    prompt = (
        "Είσαι ένας εκπαιδευτικός ιατρικός βοηθός. "
        "Με βάση το παρακάτω σενάριο ασθενούς (μορφή YAML), επίλεξε 4–6 κατάλληλες διαγνωστικές εξετάσεις και δώσε μόνο τα αποτελέσματά τους.\n"
        "Μην εξηγείς τίποτα. Δώσε μόνο τιμές, σαν αναφορά εργαστηρίου ή γνωμάτευση απεικονιστικής εξέτασης:\n\n"
        "**Δείγμα μορφής:**\n"
        "Hb: 12.5 g/dL\nNa+: 138 mmol/L\nΑκτινογραφία ισχίου: Κάταγμα υποκεφαλικό\nΗΚΓ: Φλεβοκομβικός ρυθμός\n\n"
        f"{scenario_yaml}"
    )

    result = await get_ai_generated_exam(prompt)
    print("📦 Diagnostic Test Result from AI:", result)

    return JSONResponse(content={"diagnostic_tests": result})

