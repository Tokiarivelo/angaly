import csv
import json
import os

# Mensurations standards basées sur les normes (type AFNOR / ISO 8559-1) pour le prêt-à-porter femme.
# Les valeurs sont en centimètres (cm).
standard_measurements_women = [
    {"size": "34", "tour_poitrine": 80, "tour_taille": 62, "tour_bassin": 86, "longueur_dos": 40.5, "carrure_dos": 34, "tour_cou": 33},
    {"size": "36", "tour_poitrine": 84, "tour_taille": 66, "tour_bassin": 90, "longueur_dos": 41.0, "carrure_dos": 35, "tour_cou": 34},
    {"size": "38", "tour_poitrine": 88, "tour_taille": 70, "tour_bassin": 94, "longueur_dos": 41.5, "carrure_dos": 36, "tour_cou": 35},
    {"size": "40", "tour_poitrine": 92, "tour_taille": 74, "tour_bassin": 98, "longueur_dos": 42.0, "carrure_dos": 37, "tour_cou": 36},
    {"size": "42", "tour_poitrine": 96, "tour_taille": 78, "tour_bassin": 102, "longueur_dos": 42.5, "carrure_dos": 38, "tour_cou": 37},
    {"size": "44", "tour_poitrine": 100, "tour_taille": 82, "tour_bassin": 106, "longueur_dos": 43.0, "carrure_dos": 39, "tour_cou": 38},
    {"size": "46", "tour_poitrine": 104, "tour_taille": 86, "tour_bassin": 110, "longueur_dos": 43.5, "carrure_dos": 40, "tour_cou": 39},
    {"size": "48", "tour_poitrine": 110, "tour_taille": 92, "tour_bassin": 116, "longueur_dos": 44.0, "carrure_dos": 41.5, "tour_cou": 40.5},
    {"size": "50", "tour_poitrine": 116, "tour_taille": 98, "tour_bassin": 122, "longueur_dos": 44.5, "carrure_dos": 43, "tour_cou": 42},
    {"size": "52", "tour_poitrine": 122, "tour_taille": 104, "tour_bassin": 128, "longueur_dos": 45.0, "carrure_dos": 44.5, "tour_cou": 43.5}
]

# Homme
standard_measurements_men = [
    {"size": "44", "tour_poitrine": 88, "tour_taille": 76, "tour_bassin": 92, "longueur_dos": 44, "carrure_dos": 41, "tour_cou": 37},
    {"size": "46", "tour_poitrine": 92, "tour_taille": 80, "tour_bassin": 96, "longueur_dos": 44.5, "carrure_dos": 42, "tour_cou": 38},
    {"size": "48", "tour_poitrine": 96, "tour_taille": 84, "tour_bassin": 100, "longueur_dos": 45, "carrure_dos": 43, "tour_cou": 39},
    {"size": "50", "tour_poitrine": 100, "tour_taille": 88, "tour_bassin": 104, "longueur_dos": 45.5, "carrure_dos": 44, "tour_cou": 40},
    {"size": "52", "tour_poitrine": 104, "tour_taille": 92, "tour_bassin": 108, "longueur_dos": 46, "carrure_dos": 45, "tour_cou": 41},
    {"size": "54", "tour_poitrine": 108, "tour_taille": 96, "tour_bassin": 112, "longueur_dos": 46.5, "carrure_dos": 46, "tour_cou": 42},
    {"size": "56", "tour_poitrine": 112, "tour_taille": 100, "tour_bassin": 116, "longueur_dos": 47, "carrure_dos": 47, "tour_cou": 43},
    {"size": "58", "tour_poitrine": 116, "tour_taille": 104, "tour_bassin": 120, "longueur_dos": 47.5, "carrure_dos": 48, "tour_cou": 44}
]

def generate_datasets(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Generate JSON
    data = {
        "women": standard_measurements_women,
        "men": standard_measurements_men
    }
    
    json_path = os.path.join(output_dir, "standard_measurements.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
        
    print(f"Generated JSON at {json_path}")
    
    # 2. Generate CSV for Women
    csv_women_path = os.path.join(output_dir, "standard_measurements_women.csv")
    with open(csv_women_path, "w", encoding="utf-8", newline='') as f:
        if standard_measurements_women:
            writer = csv.DictWriter(f, fieldnames=standard_measurements_women[0].keys())
            writer.writeheader()
            writer.writerows(standard_measurements_women)
            
    print(f"Generated CSV at {csv_women_path}")

    # 3. Generate CSV for Men
    csv_men_path = os.path.join(output_dir, "standard_measurements_men.csv")
    with open(csv_men_path, "w", encoding="utf-8", newline='') as f:
        if standard_measurements_men:
            writer = csv.DictWriter(f, fieldnames=standard_measurements_men[0].keys())
            writer.writeheader()
            writer.writerows(standard_measurements_men)
            
    print(f"Generated CSV at {csv_men_path}")


if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(current_dir, "..", "data"))
    generate_datasets(data_dir)
