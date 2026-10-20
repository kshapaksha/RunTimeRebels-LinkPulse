#main
import json
import os
import random
import string
from datetime import date, datetime
from io import BytesIO
from urllib.parse import urlparse

import qrcode
import requests
from flask import Flask, jsonify, redirect, request, send_file, render_template
from user_agents import parse as parse_ua
from werkzeug.security import generate_password_hash, check_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static"),
)



if os.environ.get("VERCEL"):
    DB_FILE = "/tmp/data.json"
else:
    DB_FILE = "data.json"

SAFE_BROWSING_KEY = os.environ.get("SAFE_BROWSING_KEY")



UPSTASH_URL = os.environ.get("UPSTASH_REDIS_REST_URL")
UPSTASH_TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN")


def empty_db():
    return {"links": {}, "clicks": [], "feedback": []}


def load_db():
    # Online database (used on Vercel)
    if UPSTASH_URL:
        try:
            headers = {"Authorization": "Bearer " + UPSTASH_TOKEN}
            answer = requests.post(UPSTASH_URL, headers=headers, json=["GET", "linkpulse"], timeout=4).json()
            if answer.get("result"):
                return json.loads(answer["result"])
            return empty_db()       # nothing saved yet
        except:
            return None             # could not reach it, so don't touch our data

    # No online database (running on your laptop): use the file
    if os.path.exists(DB_FILE):
        file = open(DB_FILE, "r")
        data = json.load(file)
        file.close()
        return data
    return empty_db()


def save_db():
    if UPSTASH_URL:
        try:
            headers = {"Authorization": "Bearer " + UPSTASH_TOKEN}
            requests.post(UPSTASH_URL, headers=headers, json=["SET", "linkpulse", json.dumps(db)], timeout=4)
        except:
            pass
        return

    try:
        file = open(DB_FILE, "w")
        json.dump(db, file, indent=2)
        file.close()
    except:
        pass


db = load_db()
if db == None:
    db = empty_db()

geo_cache = {}


# Before every request, read the latest shared data
@app.before_request
def refresh_db():
    global db
    if request.path.startswith("/static"):
        return
    if UPSTASH_URL:
        fresh = load_db()
        if fresh != None:
            db = fresh  


# helper 

def make_code():
    letters = string.ascii_letters + string.digits
    while True:
        code = ""
        for i in range(6):
            code = code + random.choice(letters)
        if code not in db["links"]:
            return code


def is_valid_url(url):
    parts = urlparse(url)
    if parts.scheme == "http" or parts.scheme == "https":
        if parts.netloc != "":
            return True
    return False


def is_expired(link):
    if link["expires"] == None:
        return False
    today = str(date.today())
    if today > link["expires"]:
        return True
    return False


def is_safe(url):
    if SAFE_BROWSING_KEY == None:
        if "malware.testing.google.test" in url:
            return False
        return True

    web_address = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + SAFE_BROWSING_KEY
    body = {
        "client": {"clientId": "linkpulse", "clientVersion": "1.0"},
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}],
        },
    }
    try:
        answer = requests.post(web_address, json=body, timeout=4).json()
        if "matches" in answer:
            return False        
        return True
    except:
        return True             



def show_message(message, status_code):
    html = "<body style='background:#09090b;color:white;font-family:sans-serif;text-align:center;padding-top:20vh'>"
    html = html + "<h2>" + message + "</h2>"
    html = html + "<a href='/' style='color:#22d3ee'>Back to LinkPulse</a></body>"
    return html, status_code


#saving clicks

def get_country(ip):
    if ip == "127.0.0.1" or ip == "::1":
        return "Local"             
    if ip in geo_cache:
        return geo_cache[ip]        
    try:
        web_address = "http://ip-api.com/json/" + ip + "?fields=country"
        answer = requests.get(web_address, timeout=2).json()
        country = answer.get("country", "Unknown")
    except:
        country = "Unknown"
    geo_cache[ip] = country
    return country



def log_click(link, ref=None):
    
    user_agent = parse_ua(request.headers.get("User-Agent", ""))
    if user_agent.is_mobile:
        device = "Mobile"
    elif user_agent.is_tablet:
        device = "Tablet"
    else:
        device = "Desktop"

  
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    ip = ip.split(",")[0].strip()

   
    if ref == None:
        ref = request.headers.get("Referer", "")
    referrer = urlparse(ref).netloc
    if referrer == "":
        referrer = "Direct"

    click = {
        "code": link["code"],
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "country": get_country(ip),
        "device": device,
        "browser": user_agent.browser.family,
        "referrer": referrer,
    }
    db["clicks"].append(click)
    link["clicks"] = link["clicks"] + 1     
    save_db()

#creating and redirecting 


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/unlock/<code>")
def unlock_page(code):
    return render_template("unlock.html")



@app.route("/api/shorten", methods=["POST"])
def shorten():
    data = request.get_json()
    url = data["url"].strip()

    
    if "://" not in url:
        url = "https://" + url

    if not is_valid_url(url):
        return jsonify(error="Please enter a valid link."), 400

    if not is_safe(url):
        return jsonify(error="Blocked: this link looks like phishing or malware."), 400

    
    expires = data.get("expires")
    if expires == "":
        expires = None
    if expires != None and expires < str(date.today()):
        return jsonify(error="Expiry date cannot be in the past."), 400

    
    password_hash = None
    if data.get("password") != "":
        password_hash = generate_password_hash(data["password"])

    code = make_code()
    db["links"][code] = {
        "code": code,
        "url": url,
        "owner": data["owner"],
        "password_hash": password_hash,
        "expires": expires,
        "clicks": 0,
        "blocked": False,
        "reports": 0,
    }
    save_db()
    return jsonify(code=code)



@app.route("/<code>")
def go(code):
    if code not in db["links"]:
        return show_message("Link not found", 404)

    link = db["links"][code]

    if link["blocked"]:
        return show_message("This link has been blocked for safety.", 403)

    if is_expired(link):
        return show_message("This link has expired.", 410)

    if link["password_hash"] != None:
        return redirect("/unlock/" + code)      

    log_click(link)
    return redirect(link["url"])



@app.route("/api/unlock/<code>", methods=["POST"])
def unlock(code):
    if code not in db["links"]:
        return jsonify(error="Link not found."), 404

    link = db["links"][code]
    data = request.get_json()

    if check_password_hash(link["password_hash"], data["password"]) == False:
        return jsonify(error="Wrong password."), 401

    log_click(link, data.get("ref"))
    return jsonify(url=link["url"])

#DashBoard data ,QR CODE,FEEDBACK


def count_top(clicks, key):
    counts = {}
    for click in clicks:
        value = click[key]
        if value in counts:
            counts[value] = counts[value] + 1
        else:
            counts[value] = 1

    pairs = []
    for name in counts:
        pairs.append([name, counts[name]])

    pairs.sort(key=get_second, reverse=True)   
    return pairs[0:5]


def get_second(pair):
    return pair[1]


@app.route("/api/links")
def my_links():
    owner = request.args.get("owner")
    result = []

    for code in db["links"]:
        link = db["links"][code]
        if link["owner"] == owner:
            if link["blocked"]:
                status = "Blocked"
            elif is_expired(link):
                status = "Expired"
            else:
                status = "Active"

            result.append({
                "code": link["code"],
                "url": link["url"],
                "clicks": link["clicks"],
                "status": status,
                "protected": link["password_hash"] != None,
            })

    result.reverse()       
    return jsonify(result)


@app.route("/api/stats/<code>")
def stats(code):
    if code not in db["links"]:
        return jsonify(error="Not found"), 404

    link = db["links"][code]
    if link["owner"] != request.args.get("owner"):
        return jsonify(error="Not your link"), 403

    
    clicks = []
    for click in db["clicks"]:
        if click["code"] == code:
            clicks.append(click)

   
    day_counts = {}
    for click in clicks:
        day = click["time"][0:10]       
        if day in day_counts:
            day_counts[day] = day_counts[day] + 1
        else:
            day_counts[day] = 1

    days = []
    for day in sorted(day_counts):
        days.append([day, day_counts[day]])
    days = days[-7:]                    

   
    total_stars = 0
    rating_count = 0
    for item in db["feedback"]:
        if item["code"] == code and item["type"] == "rating":
            total_stars = total_stars + item["rating"]
            rating_count = rating_count + 1

    avg_rating = None
    if rating_count > 0:
        avg_rating = round(total_stars / rating_count, 1)

    return jsonify(
        total=len(clicks),
        countries=count_top(clicks, "country"),
        referrers=count_top(clicks, "referrer"),
        devices=count_top(clicks, "device"),
        browsers=count_top(clicks, "browser"),
        days=days,
        avg_rating=avg_rating,
    )


# QR code picture
@app.route("/api/qr/<code>")
def qr(code):
    if code not in db["links"]:
        return "Not found", 404

    picture = qrcode.make(request.host_url + code)
    memory_file = BytesIO()
    picture.save(memory_file, "PNG")
    memory_file.seek(0)
    return send_file(memory_file, mimetype="image/png")



@app.route("/api/feedback", methods=["POST"])
def feedback():
    data = request.get_json()
    code = data["code"]

    if code not in db["links"]:
        return jsonify(error="No link found with that code."), 404

    link = db["links"][code]

    item = {
        "code": code,
        "type": data["type"],
        "rating": data["rating"],
        "message": data["message"],
    }
    db["feedback"].append(item)

    if data["type"] == "report":
        link["reports"] = link["reports"] + 1
        if link["reports"] >= 3:
            link["blocked"] = True

    save_db()
    return jsonify(ok=True)

@app.route("/api/site-feedback", methods=["POST"])
def site_feedback():
    data = request.get_json()
    message = data["message"].strip()

    if message == "":
        return jsonify(error="Please write something."), 400

   
    if "site_feedback" not in db:
        db["site_feedback"] = []

    item = {
        "rating": data["rating"],
        "message": message[0:500],       
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    db["site_feedback"].append(item)
    save_db()
    return jsonify(ok=True)

@app.route("/api/global-stats")
def global_stats():
    all_clicks = db["clicks"]

    
    outside_clicks = []
    for click in all_clicks:
        if click["referrer"] != "Direct":
            outside_clicks.append(click)

    sites = []
    for code in db["links"]:
        site = urlparse(db["links"][code]["url"]).netloc
        site = site.replace("www.", "")
        sites.append({"domain": site})

    return jsonify(
        total_links=len(db["links"]),
        total_clicks=len(all_clicks),
        countries=count_top(all_clicks, "country"),
        referrers=count_top(outside_clicks, "referrer"),
        shortened_sites=count_top(sites, "domain"),
    )
if __name__ == "__main__":
    app.run(debug=True)


