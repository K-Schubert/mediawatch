from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/options",
    tags=["options"]
)

# Data for categories and subcategories
categories = [
    {"id": "A", "name": "A. Manipulation of language"},
    {"id": "B", "name": "B. Manipulation through distraction and diversion"},
    {"id": "C", "name": "C. Manipulation of information and evidence"},
    {"id": "D", "name": "D. Asymétrie dans l’appel à l’empathie"},
]

subcategories = {
    "A": {
        "Reducing Responsibility": ["Passive Voice (1)", "Minimization (28)", "Euphemism (4)"],
        "Distorting meaning": ["Rebranding negative concepts (32)", "Loaded language (8)", "Glittering generalities (18)", "Sensationalism (11)", "Sensationalizing successes (60)"],
        "Creating confusion": ["Strategic ambiguity (7)", "Misleading headlines (41)", "Conflation (42)"],
    },
    "B": {
        "Shifting blame or attention": ["Scapegoating (16)", "Smokescreening (30)", "Marginalization (34)"],
        "Personal attacks": ["Ad Hominem Attacks (9)", "Overemphasis on negative aspects of opponents (35)", "Hasty Generalizations (33)"]
    },
    "C": {
        "Selective presentation": ["Selective reporting (3)", "Omission (6)", "Cherry-Picking data (7)"],
        "Presenting false or flawed evidence": ["False balance (10)", "False equivalence (11)", "Use of flawed studies (29)", "Manufactured studies (36)", "Pseudo expertise (56)"],
        "Distorting communication": ["False balance in scientific reporting (43)", "Selective quotiding (57)", "False clarity (63)"],
    },
    "D": {
        "Asymétrie dans l’appel à l’empathie": ["Appeal to Emotion (31)", "Utilisation de certains champs lexicaux", "Utilisation de mots chargés émotionnellement", "Personnification des victimes"]
    }
}

@router.get("/categories")
def get_categories():
    return categories

@router.get("/subcategories/{category_id}")
def get_subcategories(category_id: str):
    if category_id in subcategories:
        return subcategories[category_id]
    else:
        raise HTTPException(status_code=404, detail="Category not found")
