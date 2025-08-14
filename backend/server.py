from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Allow requests from React

# Mock company info
company_info = {
    "name": "STRATEGIC INFRASTRUCTURE TECHNOLOGIES",
    "address": "21121 West Hardy Road, Houston, TX 77073",
    "phone": "833-930-2583",
    "email": "info@stinte.co",
    "logo_url": "https://stinteportal-backend.onrender.com/uploads/logo.png"
}

# Mock employee list
employees = [
    {"id": 1, "name": "Don Nelson", "position": "Chief Operating Officer", "phone": "281-658-9603", "email": "dnelson@stinte.co"},
    {"id": 2, "name": "Dennis Llaneza", "position": "General Manager", "phone": "832-995-6104", "email": "dllaneza@stinte.co"},
    {"id": 3, "name": "Chris Jones", "position": "Assistant General Manager", "phone": "979-922-4182", "email": "cjones@stinte.co"},
    {"id": 4, "name": "Magda Nelson", "position": "Chief Financial Officer", "phone": "732-754-6047", "email": "magda.nelson@stinte.co"},
    {"id": 5, "name": "Xavier Llaneza", "position": "Senior Project Manager", "phone": "425-205-7020", "email": "xllaneza@stinte.co"},
    {"id": 6, "name": "Colby Sheets", "position": "Senior Project Manager", "phone": "425 830-1533", "email": "csheets@stinte.co"},
    {"id": 7, "name": "Chris Young(Canada)", "position": "Operations Manager", "phone": "416-666-1270", "email": "cyoung@stinte.co"},
    {"id": 8, "name": "Andy Garcia", "position": "Project Manager", "phone": "346-616-8335", "email": "agarcia@stinte.co"},
    {"id": 9, "name": "Sergio Sanchez", "position": "Field Service Manager", "phone": "346-490-0986", "email": "ssanchez@stinte.co"},
    {"id": 10, "name": "Matthew Nelson", "position": "Warehouse Manager", "phone": "832-928-2617", "email": "matthew@upandcs.com"},
    {"id": 11, "name": "Frank Nelson", "position": "Electrical Coordinator", "phone": "936-242-5927", "email": "frank@upandcs.com"},
    {"id": 12, "name": "Rachel Cooper", "position": "Executive Assistant ", "phone": "832-387-7055", "email": "rcooper@stinte.co"},
    {"id": 13, "name": "Melissa Pena", "position": "Office Administrator", "phone": "281-964-8206", "email": "mpena@stinte.co"},
    {"id": 14, "name": "Leslyn Paracuelles", "position": "Scheduling Analyst", "phone": "346-673-1611", "email": "lparacuelles@stinte.co"},
    {"id": 15, "name": "Kim Flowers", "position": "Travel Coordinator", "phone": "832-679-3892", "email": "kflowers@stinte.co"},
    {"id": 16, "name": "Jana Rose", "position": "Accounting Assistant", "phone": "281-414-3994", "email": "jrose@stinte.co"},
    {"id": 17, "name": "Megan Hesse", "position": "Accounting Assistant", "phone": "936-697-5811", "email": "mhesse@stinte.co"},
    {"id": 18, "name": "Evan Smith", "position": "Warehouse & Logistics", "phone": "832-691-7279", "email": "esmith@stinte.co"},
    {"id": 19, "name": "Justin Galea-Abela(Canada)", "position": "Senior Technician", "phone": "647-325-9210", "email": "jabela@stinte.co"},
    {"id": 20, "name": "Umesh Gounder(Canada)", "position": "Lead Field Technician", "phone": "647-740-9247", "email": "ugounder@stinte.co"},
    {"id": 21, "name": "Alexis Sanchez", "position": "Field Service Technician", "phone": "346-630-0321", "email": "asanchez@stinte.co"},
    {"id": 22, "name": "Chris Alaniz", "position": "Electrical/Data Technician", "phone": "936-442-0893", "email": "calaniz@stinte.co"},
    {"id": 23, "name": "Christian Garcia", "position": "Field Service Technician", "phone": "346-673-1655", "email": "cgarcia@stinte.co"},
    {"id": 24, "name": "Eddie Nelson", "position": "Electrical/Data Technician", "phone": "346-600-4147", "email": "enelson@stinte.co"},
    {"id": 25, "name": "Jose Ornelas Jr.", "position": "Field Service Technician", "phone": "915-330-8921", "email": "jornelas@stinte.co"},
    {"id": 26, "name": "Juan Paredes", "position": "Electrical Technician", "phone": "936-252-8573", "email": "jparedes@stinte.co"},
    {"id": 27, "name": "Mauricio Ramirez", "position": "Field Service Technician", "phone": "915-282-7451", "email": "mramirez@stinte.co"},
    {"id": 28, "name": "Nikolas Pedroza", "position": "Field Service Technician", "phone": "346-630-0140", "email": "npedroza@stinte.co"},
    {"id": 29, "name": "Omar Ornelas", "position": "Field Service Technician", "phone": "346-673-1712", "email": "oornelas@stinte.co"},
    {"id": 30, "name": "Phi Nguyen", "position": "Field Service Technician", "phone": "346-490-0943", "email": "pnguyen@stinte.co"},
    {"id": 31, "name": "Raul Rivera", "position": "Electrical Technician", "phone": "346-490-0666", "email": "rrivera@stinte.co"},
    {"id": 32, "name": "Ruben Jaquez", "position": "Field Service Technician", "phone": "346-673-0986", "email": "rjaquez@stinte.co"},
    {"id": 33, "name": "Chavar Young(Canada)", "position": "Field Technician", "phone": "437-881-4734", "email": "chavar.young@stinte.co"},
    {"id": 34, "name": "Ivan Kostenyuk(Canada)", "position": "Field Technician", "phone": "365-987-5169", "email": "ikostenyuk@stinte.co"},
    {"id": 35, "name": "Rocky Gu(Canada)", "position": "Field Technician", "phone": "416-939-3289", "email": "zgu@stinte.co"},
    {"id": 36, "name": "Receipts", "position": "Receipts", "phone": "936-697-5811", "email": "receipts@stinte.co"},

]

@app.route("/company-info", methods=["GET"])
def get_company_info():
    return jsonify(company_info)

@app.route("/employees", methods=["GET"])
def get_employees():
    return jsonify(employees)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_dir = os.path.join(app.root_path, 'static')
    if path != "" and os.path.exists(os.path.join(static_dir, path)):
        return send_from_directory(static_dir, path)
    else:
        return send_from_directory(static_dir, 'index.html')
    
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    uploads_dir = os.path.join(app.root_path, 'uploads')
    return send_from_directory(uploads_dir, filename)

    
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)