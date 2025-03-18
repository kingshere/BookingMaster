import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// List of Indian states and union territories (28 states + 8 UTs = 36 entities)
const indianStatesAndUTs = [
  // States (28)
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // Union Territories (8)
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Consolidated list of all districts across India (flattened from your JSON)
const allDistricts = [
  // Andhra Pradesh
  "Anakapalli", "Anantapur", "Annamayya", "Alluri Sitharama Raju", "Bapatla",
  "Chittoor", "East Godavari", "Eluru", "Guntur", "Kakinada", "Krishna",
  "Kurnool", "Nandyal", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam",
  "Vizianagaram", "West Godavari",
  // Arunachal Pradesh
  "Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey",
  "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang",
  "Siang", "Upper Siang", "Lower Siang", "Lower Dibang Valley", "Dibang Valley",
  "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding",
  // Assam
  "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo",
  "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Goalpara",
  "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup Metropolitan",
  "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur",
  "Majuli", "Morigaon", "Nagaon", "Nalbari", "Dima Hasao", "Sivasagar",
  "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong",
  // Bihar
  "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur",
  "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj",
  "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj",
  "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda",
  "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran",
  "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali",
  "West Champaran",
  // Chhattisgarh
  "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur",
  "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi",
  "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba",
  "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur",
  "Rajnandgaon", "Sukma", "Surajpur", "Surguja",
  // Goa
  "North Goa", "South Goa",
  // Gujarat
  "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch",
  "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka",
  "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch",
  "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal",
  "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar",
  "Tapi", "Vadodara", "Valsad",
  // Haryana
  "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram",
  "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh",
  "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa",
  "Sonipat", "Yamunanagar",
  // Himachal Pradesh
  "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti",
  "Mandi", "Shimla", "Sirmaur", "Solan", "Una",
  // Jharkhand
  "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum",
  "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti",
  "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi",
  "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum",
  // Karnataka
  "Bagalkot", "Ballari", "Belagavi", "Bengaluru Urban", "Bengaluru Rural",
  "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga",
  "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri",
  "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur",
  "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura",
  "Yadgir",
  // Kerala
  "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam",
  "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta",
  "Thiruvananthapuram", "Thrissur", "Wayanad",
  // Madhya Pradesh
  "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani",
  "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara",
  "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda",
  "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone",
  "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Niwari", "Panna",
  "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni",
  "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli",
  "Tikamgarh", "Ujjain", "Umaria", "Vidisha",
  // Maharashtra
  "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara",
  "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
  "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban",
  "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani",
  "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur",
  "Thane", "Wardha", "Washim", "Yavatmal",
  // Manipur
  "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West",
  "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl",
  "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul",
  // Meghalaya
  "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills",
  "Ri-Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills",
  "West Garo Hills", "West Jaintia Hills", "West Khasi Hills",
  // Mizoram
  "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai",
  "Lunglei", "Mamit", "Saitual", "Siaha", "Serchhip",
  // Nagaland
  "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Noklak",
  "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto",
  // Odisha
  "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack",
  "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur",
  "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha",
  "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada",
  "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh",
  // Punjab
  "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka",
  "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana",
  "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur",
  "Shahid Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran",
  // Rajasthan
  "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara",
  "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur",
  "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu",
  "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand",
  "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur",
  // Sikkim
  "East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim",
  // Tamil Nadu
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari",
  "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal",
  "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet",
  "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi",
  "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur",
  "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar",
  // Telangana
  "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon",
  "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar",
  "Khammam", "Komaram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial",
  "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda",
  "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla",
  "Ranga Reddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad",
  "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri",
  // Tripura
  "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura",
  "Unakoti", "West Tripura",
  // Uttar Pradesh
  "Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amethi", "Amroha",
  "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia",
  "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi",
  "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria",
  "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar",
  "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi",
  "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat",
  "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri",
  "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura",
  "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit",
  "Pratapgarh", "Prayagraj", "Rae Bareli", "Rampur", "Saharanpur", "Sambhal",
  "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar",
  "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi",
  // Uttarakhand
  "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar",
  "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal",
  "Udham Singh Nagar", "Uttarkashi",
  // West Bengal
  "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur",
  "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong",
  "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas",
  "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur",
  "Purulia", "South 24 Parganas", "Uttar Dinajpur",
  // Andaman and Nicobar Islands
  "Nicobar", "North and Middle Andaman", "South Andaman",
  // Chandigarh
  "Chandigarh",
  // Dadra and Nagar Haveli and Daman and Diu
  "Dadra and Nagar Haveli", "Daman", "Diu",
  // Delhi
  "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
  "North West Delhi", "Shahdara", "South Delhi", "South East Delhi",
  "South West Delhi", "West Delhi",
  // Jammu and Kashmir
  "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal",
  "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama",
  "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur",
  // Ladakh
  "Kargil", "Leh",
  // Lakshadweep
  "Lakshadweep",
  // Puducherry
  "Karaikal", "Mahe", "Puducherry", "Yanam"
];

const profileSchema = new mongoose.Schema({
  hotelName: {
    type: String,
    required: true,
  },
  mobileNo: {
    type: String,
    required: true,
  },
  altMobile: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
  },
  gstNo: {
    type: String,
    required: false,
  },
  website: {
    type: String,
    required: false,
  },
  addressLine1: {
    type: String,
    required: false,
  },
  addressLine2: {
    type: String,
    required: false,
  },
  district: {
    type: String,
    required: false,
    enum: allDistricts, // All districts listed as an enum
  },
  state: {
    type: String,
    required: false,
    enum: indianStatesAndUTs, // Enum with all 36 states and union territories
  },
  country: {
    type: String,
    default: 'India',
  },
  pinCode: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  Profile_Complete: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no',
  },
  Active: {
    type: String,
    enum: ['yes', 'no'],
    default: 'yes',
  },
  forgotUsername: {
    type: Boolean,
    default: false,
  },
  forgotPassword: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

profileSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);
export default Profile;