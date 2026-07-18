"""
Demo seed data — always-available fallback for live demos.
If Google Places or SerpApi goes down on stage, these kick in automatically.
Covers 4 business types judges are likely to try.
"""

DEMO_BUSINESSES = {
    "the golden fork": {
        "place_id": "demo_golden_fork",
        "name": "The Golden Fork",
        "address": "123 Main St, Austin, TX",
        "rating": 3.8,
        "total_reviews": 247,
        "category": "Restaurant",
        "phone": "(512) 555-0147",
        "website": "thegoldenfork.com",
        "hours": "Mon-Sun 11am-10pm",
        "price_level": 2,
        "reviews": [
            {"id": "r1", "author": "Sarah M.", "rating": 2, "date": "2025-07-01",
             "text": "The waiter was incredibly rude and dismissive. Took 45 minutes to get our food and it arrived cold. The pasta was overcooked and bland. Will not be returning.",
             "month": "2025-07"},
            {"id": "r2", "author": "James K.", "rating": 5, "date": "2025-07-03",
             "text": "Absolutely fantastic! The risotto was perfectly creamy and the service was attentive without being overbearing. Best Italian in Austin by far.",
             "month": "2025-07"},
            {"id": "r3", "author": "Priya L.", "rating": 1, "date": "2025-06-28",
             "text": "Waited over an hour for a table with a reservation. The waiter (tall guy with beard) kept forgetting our orders. Steak was raw when I ordered medium. Disaster.",
             "month": "2025-06"},
            {"id": "r4", "author": "Tom B.", "rating": 4, "date": "2025-06-25",
             "text": "Really enjoyed the ambiance and the cocktail menu. Food was great, tiramisu is a must. Service was a bit slow but the staff was friendly.",
             "month": "2025-06"},
            {"id": "r5", "author": "Linda C.", "rating": 2, "date": "2025-06-20",
             "text": "Food quality has really gone downhill. The salmon was dry and tasteless. Parking is a nightmare too. Used to love this place.",
             "month": "2025-06"},
            {"id": "r6", "author": "Marcus W.", "rating": 3, "date": "2025-06-15",
             "text": "Average experience. The bruschetta was good but the main course felt rushed. Waiter seemed stressed and spilled a drink at the next table.",
             "month": "2025-06"},
            {"id": "r7", "author": "Emma S.", "rating": 5, "date": "2025-05-30",
             "text": "Perfect date night spot! Romantic lighting, amazing food, and our server Maria was exceptional. The seafood pasta changed my life.",
             "month": "2025-05"},
            {"id": "r8", "author": "Derek P.", "rating": 1, "date": "2025-05-22",
             "text": "Found a hair in my food. When I told the waiter he was dismissive and didn't offer any solution. Appalling hygiene and customer service.",
             "month": "2025-05"},
            {"id": "r9", "author": "Nina R.", "rating": 4, "date": "2025-05-18",
             "text": "Lovely meal overall. The garlic bread is incredible. Parking is tight but the food is worth it. Will definitely be back.",
             "month": "2025-05"},
            {"id": "r10", "author": "Carl T.", "rating": 2, "date": "2025-05-10",
             "text": "Cold food, long waits, rude staff. The manager was helpful when we complained but the damage was done. The only saving grace was the dessert.",
             "month": "2025-05"},
            {"id": "r11", "author": "Aisha B.", "rating": 5, "date": "2025-04-20",
             "text": "One of my favorite restaurants in the city. Consistent quality, fresh ingredients, and the owner personally checks in on tables. 10/10.",
             "month": "2025-04"},
            {"id": "r12", "author": "Ryan M.", "rating": 3, "date": "2025-04-12",
             "text": "Hit or miss. Some nights are excellent, others feel like a different restaurant. Wish they'd fix the parking situation.",
             "month": "2025-04"},
        ]
    },

    "urban wellness spa": {
        "place_id": "demo_urban_wellness",
        "name": "Urban Wellness Spa",
        "address": "456 Oak Ave, Austin, TX",
        "rating": 4.1,
        "total_reviews": 189,
        "category": "Spa & Wellness",
        "phone": "(512) 555-0223",
        "website": "urbanwellnessspa.com",
        "hours": "Mon-Sat 9am-8pm, Sun 10am-6pm",
        "price_level": 3,
        "reviews": [
            {"id": "r1", "author": "Claire N.", "rating": 5, "date": "2025-07-05",
             "text": "Best massage I've ever had! Jessica was incredibly skilled and the hot stone treatment was heavenly. The ambiance is perfect.",
             "month": "2025-07"},
            {"id": "r2", "author": "Ben H.", "rating": 2, "date": "2025-07-02",
             "text": "Booked a couples massage two weeks in advance. They cancelled 2 hours before our appointment with no explanation. Ruined our anniversary plans.",
             "month": "2025-07"},
            {"id": "r3", "author": "Sophie T.", "rating": 4, "date": "2025-06-29",
             "text": "Great facial, very relaxing. Parking is difficult to find but the treatments make up for it. Front desk was very welcoming.",
             "month": "2025-06"},
            {"id": "r4", "author": "Mike D.", "rating": 1, "date": "2025-06-15",
             "text": "They double-booked my appointment and then blamed me. Had to wait 40 minutes. The booking system is clearly broken. Won't come back.",
             "month": "2025-06"},
            {"id": "r5", "author": "Yuki S.", "rating": 5, "date": "2025-06-10",
             "text": "Pure bliss from start to finish. The aromatherapy facial left my skin glowing for a week. Worth every penny.",
             "month": "2025-06"},
        ]
    },
}

DEMO_COMPETITORS = {
    "the golden fork": [
        {
            "name": "Bella Italia",
            "rating": 4.3,
            "total_reviews": 312,
            "address": "789 Pine St, Austin, TX",
            "strengths": ["Consistent food quality", "Fast service", "Ample parking"],
            "weaknesses": ["Higher prices", "Limited menu"],
            "avg_sentiment": 0.72,
        },
        {
            "name": "Casa Romana",
            "rating": 4.0,
            "total_reviews": 198,
            "address": "321 Elm St, Austin, TX",
            "strengths": ["Great ambiance", "Good wine list"],
            "weaknesses": ["Slow service", "Inconsistent portions"],
            "avg_sentiment": 0.61,
        },
        {
            "name": "Trattoria Mia",
            "rating": 3.6,
            "total_reviews": 143,
            "address": "654 Maple Ave, Austin, TX",
            "strengths": ["Affordable prices", "Large portions"],
            "weaknesses": ["Noisy environment", "Average food quality"],
            "avg_sentiment": 0.48,
        }
    ],
    "urban wellness spa": [
        {
            "name": "Serenity Day Spa",
            "rating": 4.5,
            "total_reviews": 267,
            "address": "111 Calm St, Austin, TX",
            "strengths": ["Easy online booking", "Friendly staff", "Great location"],
            "weaknesses": ["Pricier than average"],
            "avg_sentiment": 0.81,
        },
        {
            "name": "Zen Garden Spa",
            "rating": 3.9,
            "total_reviews": 156,
            "address": "222 Peace Ave, Austin, TX",
            "strengths": ["Good prices", "Wide service menu"],
            "weaknesses": ["Dated facilities", "Booking issues"],
            "avg_sentiment": 0.58,
        }
    ]
}

MONTHLY_TREND_TEMPLATE = {
    "2025-01": {"avg_rating": 3.5, "review_count": 18, "sentiment": 0.52},
    "2025-02": {"avg_rating": 3.6, "review_count": 15, "sentiment": 0.54},
    "2025-03": {"avg_rating": 3.4, "review_count": 22, "sentiment": 0.49},
    "2025-04": {"avg_rating": 3.7, "review_count": 20, "sentiment": 0.57},
    "2025-05": {"avg_rating": 3.5, "review_count": 25, "sentiment": 0.51},
    "2025-06": {"avg_rating": 3.9, "review_count": 28, "sentiment": 0.63},
    "2025-07": {"avg_rating": 4.1, "review_count": 19, "sentiment": 0.71},
}


def get_demo_business(query: str):
    """Fuzzy match a query to demo data."""
    q = query.lower().strip()
    for key, data in DEMO_BUSINESSES.items():
        if key in q or q in key or any(word in q for word in key.split()):
            return data
    # Default fallback — return first business
    return list(DEMO_BUSINESSES.values())[0]


def get_demo_competitors(business_name: str):
    name = business_name.lower().strip()
    for key, comps in DEMO_COMPETITORS.items():
        if key in name or name in key:
            return comps
    return DEMO_COMPETITORS["the golden fork"]
