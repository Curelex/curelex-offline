import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { apiRegister, apiLogin } from '../utils/api';
import curelexLogo from '../assets/image.png';

// ── Mobile detection hook ─────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 480);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ── India Geographic Data ─────────────────────────────────────────────────────
const INDIA_DATA = {
  'Punjab': {
    districts: {
      'Amritsar':    ['Amritsar','Ajnala','Attari','Jandiala Guru','Majitha'],
      'Barnala':     ['Barnala','Dhanaula','Sehna'],
      'Bathinda':    ['Bathinda','Rampura Phul','Talwandi Sabo','Phul','Nathana'],
      'Faridkot':    ['Faridkot','Kotkapura','Jaitu'],
      'Fatehgarh Sahib': ['Fatehgarh Sahib','Amloh','Bassi Pathana','Mandi Gobindgarh'],
      'Fazilka':     ['Fazilka','Abohar','Jalalabad'],
      'Ferozepur':   ['Ferozepur','Zira','Guru Har Sahai','Mamdot'],
      'Gurdaspur':   ['Gurdaspur','Batala','Pathankot','Dhariwal','Dera Baba Nanak'],
      'Hoshiarpur':  ['Hoshiarpur','Dasuya','Mukerian','Garhshankar','Tanda Urmur'],
      'Jalandhar':   ['Jalandhar','Nakodar','Phillaur','Shahkot','Adampur'],
      'Kapurthala':  ['Kapurthala','Phagwara','Sultanpur Lodhi','Dhilwan'],
      'Ludhiana':    ['Ludhiana','Khanna','Samrala','Raikot','Jagraon'],
      'Mansa':       ['Mansa','Budhlada','Sardulgarh','Bareta'],
      'Moga':        ['Moga','Baghapurana','Dharamkot','Nihal Singh Wala'],
      'Mohali':      ['Mohali','Kharar','Dera Bassi','Banur','Kurali'],
      'Muktsar':     ['Muktsar','Gidderbaha','Malout','Lambi'],
      'Nawanshahr':  ['Nawanshahr','Balachaur','Banga','Rahon'],
      'Patiala':     ['Patiala','Rajpura','Nabha','Sangrur','Samana'],
      'Rupnagar':    ['Rupnagar','Anandpur Sahib','Morinda','Chamkaur Sahib'],
      'Sangrur':     ['Sangrur','Sunam','Malerkotla','Dhuri','Lehra Gaga'],
      'Tarn Taran':  ['Tarn Taran','Patti','Khem Karan','Bhikhiwind'],
    }
  },
  'Haryana': {
    districts: {
      'Ambala':         ['Ambala','Ambala Cantt','Naraingarh','Mullana','Barara'],
      'Bhiwani':        ['Bhiwani','Charkhi Dadri','Loharu','Siwani'],
      'Faridabad':      ['Faridabad','Ballabhgarh','Tigaon','Palwal'],
      'Fatehabad':      ['Fatehabad','Ratia','Tohana','Jakhal'],
      'Gurugram':       ['Gurugram','Manesar','Pataudi','Sohna','Wazirabad'],
      'Hisar':          ['Hisar','Hansi','Barwala','Narwana','Uklana'],
      'Jhajjar':        ['Jhajjar','Bahadurgarh','Beri','Machhrauli'],
      'Jind':           ['Jind','Narwana','Safidon','Uchana'],
      'Kaithal':        ['Kaithal','Cheeka','Guhla','Pundri'],
      'Karnal':         ['Karnal','Panipat','Assandh','Gharaunda','Indri'],
      'Kurukshetra':    ['Kurukshetra','Thanesar','Pehowa','Shahabad','Ladwa'],
      'Mahendragarh':   ['Mahendragarh','Narnaul','Ateli','Nangal Chaudhry'],
      'Nuh':            ['Nuh','Punhana','Tauru','Ferozpur Jhirka'],
      'Palwal':         ['Palwal','Hathin','Hodal','Hassanpur'],
      'Panchkula':      ['Panchkula','Kalka','Pinjore','Barwala'],
      'Rewari':         ['Rewari','Bawal','Dharuhera','Kosli'],
      'Rohtak':         ['Rohtak','Meham','Asthal Bohar','Sampla'],
      'Sirsa':          ['Sirsa','Dabwali','Ellenabad','Rania'],
      'Sonipat':        ['Sonipat','Gohana','Kharkhoda','Rai','Murthal'],
      'Yamunanagar':    ['Yamunanagar','Jagadhri','Bilaspur','Chhachhrauli'],
    }
  },
  'Himachal Pradesh': {
    districts: {
      'Bilaspur':   ['Bilaspur','Ghumarwin','Swarghat','Naina Devi'],
      'Chamba':     ['Chamba','Dalhousie','Khajjiar','Bharmour','Churah'],
      'Hamirpur':   ['Hamirpur','Barsar','Sujanpur','Nadaun'],
      'Kangra':     ['Dharamshala','Palampur','Nurpur','Dehra Gopipur','Baijnath','Jawali'],
      'Kinnaur':    ['Reckong Peo','Kalpa','Sangla','Pooh'],
      'Kullu':      ['Kullu','Manali','Banjar','Anni'],
      'Lahaul Spiti': ['Keylong','Kaza','Udaipur'],
      'Mandi':      ['Mandi','Sundernagar','Jogindernagar','Sarkaghat'],
      'Shimla':     ['Shimla','Solan','Kasauli','Narkanda','Rampur'],
      'Sirmaur':    ['Nahan','Paonta Sahib','Shillai','Rajgarh'],
      'Solan':      ['Solan','Baddi','Nalagarh','Kasauli','Parwanoo'],
      'Una':        ['Una','Amb','Haroli','Bangana'],
    }
  },
  'Jammu & Kashmir': {
    districts: {
      'Jammu':        ['Jammu','Nagrota','Bishnah','Akhnoor','Marh'],
      'Srinagar':     ['Srinagar','Ganderbal','Budgam','Pampore'],
      'Anantnag':     ['Anantnag','Pahalgam','Bijbehara','Dooru'],
      'Baramulla':    ['Baramulla','Sopore','Kupwara','Pattan','Gulmarg'],
      'Kathua':       ['Kathua','Billawar','Basholi','Hiranagar'],
      'Udhampur':     ['Udhampur','Ramnagar','Chenani','Majalta'],
      'Rajouri':      ['Rajouri','Nowshera','Sundarbani','Thanamandi'],
      'Poonch':       ['Poonch','Surankote','Mandi','Haveli'],
      'Kulgam':       ['Kulgam','Devsar','Qazigund','Damhal Hanjipora'],
      'Shopian':      ['Shopian','Kellar','Zainpora'],
      'Pulwama':      ['Pulwama','Awantipora','Tral','Pampore'],
      'Bandipora':    ['Bandipora','Sonawari','Gurez','Sumbal'],
      'Leh':          ['Leh','Nubra','Zanskar','Nyoma'],
      'Kargil':       ['Kargil','Drass','Sankoo','Zanskar'],
    }
  },
  'Delhi': {
    districts: {
      'Central Delhi':    ['Karol Bagh','Paharganj','Daryaganj'],
      'East Delhi':       ['Preet Vihar','Laxmi Nagar','Vivek Vihar','Shahdara'],
      'New Delhi':        ['Connaught Place','Chanakyapuri','Sarojini Nagar'],
      'North Delhi':      ['Model Town','Rohini','Burari','Mukherjee Nagar'],
      'North East Delhi': ['Dilshad Garden','Seelam Pur','Yamuna Vihar'],
      'North West Delhi': ['Pitampura','Shalimar Bagh','Ashok Vihar'],
      'Shahdara':         ['Shahdara','Gandhi Nagar','Vivek Vihar'],
      'South Delhi':      ['Saket','Hauz Khas','Lajpat Nagar','Malviya Nagar'],
      'South East Delhi': ['Okhla','Jamia Nagar','Sarita Vihar'],
      'South West Delhi': ['Dwarka','Palam','Najafgarh','Vasant Kunj'],
      'West Delhi':       ['Janakpuri','Rajouri Garden','Uttam Nagar','Tagore Garden'],
    }
  },
  'Uttar Pradesh': {
    districts: {
      'Agra':        ['Agra','Firozabad','Fatehpur Sikri','Tundla','Etmadpur'],
      'Aligarh':     ['Aligarh','Hathras','Khair','Iglas'],
      'Allahabad':   ['Prayagraj','Naini','Phulpur','Handia'],
      'Bareilly':    ['Bareilly','Pilibhit','Shahjahanpur','Rampur','Aonla'],
      'Gautam Buddh Nagar': ['Noida','Greater Noida','Dadri','Jewar'],
      'Ghaziabad':   ['Ghaziabad','Loni','Modinagar','Hapur','Muradnagar'],
      'Gorakhpur':   ['Gorakhpur','Deoria','Maharajganj','Kushinagar'],
      'Kanpur':      ['Kanpur','Kanpur Dehat','Akbarpur','Ghatampur'],
      'Lucknow':     ['Lucknow','Malihabad','Mohanlalganj','Kakori'],
      'Mathura':     ['Mathura','Vrindavan','Govardhan','Kosikalan'],
      'Meerut':      ['Meerut','Hapur','Modinagar','Garh Mukteswar'],
      'Varanasi':    ['Varanasi','Mirzapur','Bhadohi','Gyanpur'],
    }
  },
  'Rajasthan': {
    districts: {
      'Jaipur':      ['Jaipur','Amer','Sanganer','Chaksu','Dudu'],
      'Jodhpur':     ['Jodhpur','Pali','Barmer','Jaisalmer','Bilara'],
      'Udaipur':     ['Udaipur','Chittorgarh','Rajsamand','Nathdwara'],
      'Kota':        ['Kota','Bundi','Baran','Jhalawar'],
      'Ajmer':       ['Ajmer','Pushkar','Kishangarh','Beawar','Nasirabad'],
      'Alwar':       ['Alwar','Bharatpur','Deeg','Behror'],
      'Bikaner':     ['Bikaner','Nokha','Lunkaransar','Kolayat'],
      'Sikar':       ['Sikar','Laxmangarh','Fatehpur','Danta Ramgarh'],
      'Sriganganagar': ['Sriganganagar','Suratgarh','Anupgarh','Raisinghnagar'],
    }
  },
  'Maharashtra': {
    districts: {
      'Mumbai':      ['Mumbai','Bandra','Andheri','Borivali','Kurla','Dadar'],
      'Pune':        ['Pune','Pimpri-Chinchwad','Lonavala','Baramati','Talegaon'],
      'Nashik':      ['Nashik','Igatpuri','Sinnar','Niphad','Deolali'],
      'Nagpur':      ['Nagpur','Wardha','Yavatmal','Amravati','Chandrapur'],
      'Aurangabad':  ['Aurangabad','Jalna','Latur','Nanded','Osmanabad'],
      'Thane':       ['Thane','Navi Mumbai','Kalyan','Dombivli','Bhiwandi'],
      'Solapur':     ['Solapur','Barshi','Pandharpur','Akkalkot'],
      'Kolhapur':    ['Kolhapur','Ichalkaranji','Sangli','Miraj','Satara'],
    }
  },
  'Gujarat': {
    districts: {
      'Ahmedabad':   ['Ahmedabad','Gandhinagar','Sanand','Bavla','Dholka'],
      'Surat':       ['Surat','Bardoli','Mandvi','Mangrol','Olpad'],
      'Vadodara':    ['Vadodara','Anand','Ankleshwar','Karjan'],
      'Rajkot':      ['Rajkot','Junagadh','Porbandar','Gondal','Jetpur'],
      'Bhavnagar':   ['Bhavnagar','Sihor','Palitana','Mahuva'],
      'Jamnagar':    ['Jamnagar','Dwarka','Khambhalia','Lalpur'],
      'Gandhinagar': ['Gandhinagar','Kalol','Mansa','Dehgam'],
      'Mehsana':     ['Mehsana','Patan','Visnagar','Unjha'],
    }
  },
  'Karnataka': {
    districts: {
      'Bengaluru Urban': ['Bengaluru','Electronic City','Whitefield','Yelahanka'],
      'Bengaluru Rural': ['Devanahalli','Doddaballapura','Hosakote','Nelamangala'],
      'Mysuru':      ['Mysuru','Mandya','T Narasipura','Nanjangud'],
      'Hubballi':    ['Hubballi','Dharwad','Gadag','Haveri','Ron'],
      'Belagavi':    ['Belagavi','Vijayapura','Bagalkot','Gokak'],
      'Mangaluru':   ['Mangaluru','Udupi','Puttur','Bantwal'],
      'Davanagere':  ['Davanagere','Chitradurga','Harihar','Channagiri'],
      'Kalaburagi':  ['Kalaburagi','Bidar','Raichur','Yadgir','Shorapur'],
    }
  },
  'Tamil Nadu': {
    districts: {
      'Chennai':     ['Chennai','Ambattur','Avadi','Tambaram','Chromepet'],
      'Coimbatore':  ['Coimbatore','Tiruppur','Mettupalayam','Pollachi'],
      'Madurai':     ['Madurai','Dindigul','Sivakasi','Virudhunagar'],
      'Salem':       ['Salem','Namakkal','Erode','Bhavani','Rasipuram'],
      'Tiruchirappalli': ['Tiruchirappalli','Thanjavur','Kumbakonam','Ariyalur'],
      'Tirunelveli': ['Tirunelveli','Nagercoil','Tenkasi','Valliyur'],
      'Vellore':     ['Vellore','Ranipet','Arakkonam','Arcot'],
    }
  },
  'West Bengal': {
    districts: {
      'Kolkata':     ['Kolkata','Howrah','Salt Lake','Rajarhat','Dum Dum'],
      'Howrah':      ['Howrah','Uluberia','Bally','Sankrail'],
      'North 24 Parganas': ['Barasat','Barrackpore','Dum Dum','Bangaon'],
      'South 24 Parganas': ['Diamond Harbour','Budge Budge','Baruipur','Kakdwip'],
      'Murshidabad': ['Berhampore','Jangipur','Lalbagh','Jiaganj'],
      'Burdwan':     ['Durgapur','Asansol','Bardhaman','Kalna'],
      'Nadia':       ['Krishnanagar','Kalyani','Santipur','Nabadwip'],
      'Darjeeling':  ['Darjeeling','Siliguri','Kurseong','Kalimpong'],
    }
  },
  'Madhya Pradesh': {
    districts: {
      'Bhopal':      ['Bhopal','Berasia','Phanda','Mandideep'],
      'Indore':      ['Indore','Dewas','Mhow','Sanwer','Pithampur'],
      'Jabalpur':    ['Jabalpur','Katni','Mandla','Narsinghpur'],
      'Gwalior':     ['Gwalior','Shivpuri','Guna','Datia','Bhind'],
      'Ujjain':      ['Ujjain','Ratlam','Mandsaur','Neemuch'],
      'Sagar':       ['Sagar','Damoh','Tikamgarh','Chhatarpur'],
      'Rewa':        ['Rewa','Satna','Sidhi','Singrauli'],
    }
  },
  'Andhra Pradesh': {
    districts: {
      'Visakhapatnam': ['Visakhapatnam','Anakapalle','Bheemunipatnam','Narsipatnam'],
      'Vijayawada':  ['Vijayawada','Machilipatnam','Nuzvid','Gudivada'],
      'Guntur':      ['Guntur','Tenali','Narasaraopet','Bapatla'],
      'Tirupati':    ['Tirupati','Nellore','Chittoor','Madanapalle'],
      'Kadapa':      ['Kadapa','Proddatur','Rajampet','Pulivendula'],
      'Kurnool':     ['Kurnool','Nandyal','Adoni','Yemmiganur'],
      'Srikakulam':  ['Srikakulam','Palasa','Narasannapeta','Rajam'],
    }
  },
  'Telangana': {
    districts: {
      'Hyderabad':   ['Hyderabad','Secunderabad','Kondapur','Gachibowli','Kukatpally'],
      'Rangareddy':  ['Rangareddy','LB Nagar','Mehdipatnam','Attapur','Shamshabad'],
      'Medchal':     ['Kompally','Medchal','Ghatkesar','Uppal','Alwal'],
      'Warangal':    ['Warangal','Kazipet','Hanamkonda','Narsampet'],
      'Karimnagar':  ['Karimnagar','Peddapalli','Jagtial','Sircilla'],
      'Nizamabad':   ['Nizamabad','Armoor','Bodhan','Kamareddy'],
    }
  },
  'Kerala': {
    districts: {
      'Thiruvananthapuram': ['Thiruvananthapuram','Attingal','Neyyattinkara','Nedumangad'],
      'Ernakulam':   ['Kochi','Aluva','Perumbavoor','Angamaly','Muvattupuzha'],
      'Kozhikode':   ['Kozhikode','Vadakara','Feroke','Koyilandy'],
      'Thrissur':    ['Thrissur','Palakkad','Guruvayur','Kodungallur'],
      'Kollam':      ['Kollam','Punalur','Karunagappally','Paravur'],
      'Malappuram':  ['Malappuram','Tirur','Manjeri','Ponnani','Perinthalmanna'],
      'Kannur':      ['Kannur','Thalassery','Payyannur','Iritty'],
      'Alappuzha':   ['Alappuzha','Cherthala','Haripad','Kuttanad'],
    }
  },
  'Odisha': {
    districts: {
      'Bhubaneswar': ['Bhubaneswar','Cuttack','Puri','Khordha'],
      'Cuttack':     ['Cuttack','Choudwar','Athagarh','Banki'],
      'Sambalpur':   ['Sambalpur','Jharsuguda','Bargarh','Rourkela'],
      'Berhampur':   ['Berhampur','Aska','Bhanjanagar','Phulbani'],
    }
  },
  'Bihar': {
    districts: {
      'Patna':       ['Patna','Danapur','Hajipur','Biharsharif'],
      'Gaya':        ['Gaya','Bodh Gaya','Jehanabad','Nawada'],
      'Muzaffarpur': ['Muzaffarpur','Sitamarhi','Sheohar','Vaishali'],
      'Bhagalpur':   ['Bhagalpur','Banka','Munger','Lakhisarai'],
    }
  },
  'Uttarakhand': {
    districts: {
      'Dehradun':    ['Dehradun','Rishikesh','Haridwar','Mussoorie','Vikasnagar'],
      'Nainital':    ['Nainital','Haldwani','Ramnagar','Bhimtal','Kathgodam'],
      'Almora':      ['Almora','Ranikhet','Bageshwar','Chaukori'],
      'Haridwar':    ['Haridwar','Roorkee','Jwalapur','Laksar'],
      'Pauri Garhwal': ['Pauri','Kotdwara','Srinagar','Lansdowne'],
    }
  },
  'Assam': {
    districts: {
      'Guwahati':    ['Guwahati','Dispur','Jalukbari','Azara','North Guwahati'],
      'Dibrugarh':   ['Dibrugarh','Tinsukia','Duliajan','Moran'],
      'Jorhat':      ['Jorhat','Sibsagar','Golaghat','Majuli'],
      'Silchar':     ['Silchar','Karimganj','Hailakandi','Sonai'],
    }
  },
  'Chhattisgarh': {
    districts: {
      'Raipur':      ['Raipur','Durg','Bhilai','Birgaon','Arang'],
      'Bilaspur':    ['Bilaspur','Korba','Janjgir','Ratanpur'],
      'Jagdalpur':   ['Jagdalpur','Kondagaon','Narayanpur','Dantewada'],
    }
  },
  'Jharkhand': {
    districts: {
      'Ranchi':      ['Ranchi','Ramgarh','Khunti','Bundu'],
      'Dhanbad':     ['Dhanbad','Jharia','Sindri','Baghmara'],
      'Jamshedpur':  ['Jamshedpur','Seraikela','Chaibasa','Ghatsila'],
      'Hazaribagh':  ['Hazaribagh','Koderma','Giridih','Chatra'],
    }
  },
  'Goa': {
    districts: {
      'North Goa':   ['Panaji','Mapusa','Calangute','Candolim','Pernem'],
      'South Goa':   ['Margao','Vasco da Gama','Ponda','Quepem','Canacona'],
    }
  },
};

// Pincode → state/district lookup (sample — covers major pincodes)
const PINCODE_DATA = {
  // Punjab
  '141001': { state: 'Punjab', district: 'Ludhiana' },
  '141002': { state: 'Punjab', district: 'Ludhiana' },
  '141003': { state: 'Punjab', district: 'Ludhiana' },
  '143001': { state: 'Punjab', district: 'Amritsar' },
  '143002': { state: 'Punjab', district: 'Amritsar' },
  '144001': { state: 'Punjab', district: 'Jalandhar' },
  '144002': { state: 'Punjab', district: 'Jalandhar' },
  '147001': { state: 'Punjab', district: 'Patiala' },
  '147002': { state: 'Punjab', district: 'Patiala' },
  '151001': { state: 'Punjab', district: 'Bathinda' },
  '151005': { state: 'Punjab', district: 'Bathinda' },
  '148001': { state: 'Punjab', district: 'Sangrur' },
  '142001': { state: 'Punjab', district: 'Moga' },
  '152001': { state: 'Punjab', district: 'Ferozepur' },
  '145001': { state: 'Punjab', district: 'Pathankot' },
  '160001': { state: 'Punjab', district: 'Mohali' },
  '140301': { state: 'Punjab', district: 'Rupnagar' },
  '146001': { state: 'Punjab', district: 'Hoshiarpur' },
  '158001': { state: 'Punjab', district: 'Faridkot' },
  '135001': { state: 'Haryana', district: 'Yamunanagar' },
  // Haryana
  '122001': { state: 'Haryana', district: 'Gurugram' },
  '121001': { state: 'Haryana', district: 'Faridabad' },
  '124001': { state: 'Haryana', district: 'Rohtak' },
  '125001': { state: 'Haryana', district: 'Hisar' },
  '132001': { state: 'Haryana', district: 'Karnal' },
  '136001': { state: 'Haryana', district: 'Kurukshetra' },
  '123001': { state: 'Haryana', district: 'Mahendragarh' },
  '131001': { state: 'Haryana', district: 'Sonipat' },
  '126001': { state: 'Haryana', district: 'Jind' },
  '134001': { state: 'Haryana', district: 'Ambala' },
  '134003': { state: 'Haryana', district: 'Panchkula' },
  '160101': { state: 'Haryana', district: 'Panchkula' },
  // Himachal Pradesh
  '171001': { state: 'Himachal Pradesh', district: 'Shimla' },
  '175001': { state: 'Himachal Pradesh', district: 'Mandi' },
  '176001': { state: 'Himachal Pradesh', district: 'Kangra' },
  '176215': { state: 'Himachal Pradesh', district: 'Kullu' },
  '173001': { state: 'Himachal Pradesh', district: 'Solan' },
  '174001': { state: 'Himachal Pradesh', district: 'Bilaspur' },
  // Delhi
  '110001': { state: 'Delhi', district: 'New Delhi' },
  '110002': { state: 'Delhi', district: 'Central Delhi' },
  '110005': { state: 'Delhi', district: 'Central Delhi' },
  '110007': { state: 'Delhi', district: 'North Delhi' },
  '110010': { state: 'Delhi', district: 'South West Delhi' },
  '110014': { state: 'Delhi', district: 'South Delhi' },
  '110017': { state: 'Delhi', district: 'South Delhi' },
  '110020': { state: 'Delhi', district: 'South West Delhi' },
  '110024': { state: 'Delhi', district: 'South East Delhi' },
  '110025': { state: 'Delhi', district: 'South Delhi' },
  '110032': { state: 'Delhi', district: 'East Delhi' },
  '110051': { state: 'Delhi', district: 'North East Delhi' },
  '110063': { state: 'Delhi', district: 'West Delhi' },
  '110085': { state: 'Delhi', district: 'North West Delhi' },
  // Uttar Pradesh
  '226001': { state: 'Uttar Pradesh', district: 'Lucknow' },
  '201301': { state: 'Uttar Pradesh', district: 'Gautam Buddh Nagar' },
  '201001': { state: 'Uttar Pradesh', district: 'Ghaziabad' },
  '282001': { state: 'Uttar Pradesh', district: 'Agra' },
  '208001': { state: 'Uttar Pradesh', district: 'Kanpur' },
  '221001': { state: 'Uttar Pradesh', district: 'Varanasi' },
  '250001': { state: 'Uttar Pradesh', district: 'Meerut' },
  '202001': { state: 'Uttar Pradesh', district: 'Aligarh' },
  '211001': { state: 'Uttar Pradesh', district: 'Allahabad' },
  '243001': { state: 'Uttar Pradesh', district: 'Bareilly' },
  '261001': { state: 'Uttar Pradesh', district: 'Gorakhpur' },
  // Rajasthan
  '302001': { state: 'Rajasthan', district: 'Jaipur' },
  '342001': { state: 'Rajasthan', district: 'Jodhpur' },
  '313001': { state: 'Rajasthan', district: 'Udaipur' },
  '324001': { state: 'Rajasthan', district: 'Kota' },
  '305001': { state: 'Rajasthan', district: 'Ajmer' },
  '334001': { state: 'Rajasthan', district: 'Bikaner' },
  '301001': { state: 'Rajasthan', district: 'Alwar' },
  // Maharashtra
  '400001': { state: 'Maharashtra', district: 'Mumbai' },
  '411001': { state: 'Maharashtra', district: 'Pune' },
  '422001': { state: 'Maharashtra', district: 'Nashik' },
  '440001': { state: 'Maharashtra', district: 'Nagpur' },
  '431001': { state: 'Maharashtra', district: 'Aurangabad' },
  '400601': { state: 'Maharashtra', district: 'Thane' },
  // Gujarat
  '380001': { state: 'Gujarat', district: 'Ahmedabad' },
  '395001': { state: 'Gujarat', district: 'Surat' },
  '390001': { state: 'Gujarat', district: 'Vadodara' },
  '360001': { state: 'Gujarat', district: 'Rajkot' },
  '364001': { state: 'Gujarat', district: 'Bhavnagar' },
  '361001': { state: 'Gujarat', district: 'Jamnagar' },
  '382001': { state: 'Gujarat', district: 'Gandhinagar' },
  // Karnataka
  '560001': { state: 'Karnataka', district: 'Bengaluru Urban' },
  '570001': { state: 'Karnataka', district: 'Mysuru' },
  '580001': { state: 'Karnataka', district: 'Hubballi' },
  '590001': { state: 'Karnataka', district: 'Belagavi' },
  '575001': { state: 'Karnataka', district: 'Mangaluru' },
  // Tamil Nadu
  '600001': { state: 'Tamil Nadu', district: 'Chennai' },
  '641001': { state: 'Tamil Nadu', district: 'Coimbatore' },
  '625001': { state: 'Tamil Nadu', district: 'Madurai' },
  '636001': { state: 'Tamil Nadu', district: 'Salem' },
  '620001': { state: 'Tamil Nadu', district: 'Tiruchirappalli' },
  // West Bengal
  '700001': { state: 'West Bengal', district: 'Kolkata' },
  '711101': { state: 'West Bengal', district: 'Howrah' },
  '743201': { state: 'West Bengal', district: 'North 24 Parganas' },
  // Telangana
  '500001': { state: 'Telangana', district: 'Hyderabad' },
  '500032': { state: 'Telangana', district: 'Rangareddy' },
  '500055': { state: 'Telangana', district: 'Medchal' },
  // Kerala
  '695001': { state: 'Kerala', district: 'Thiruvananthapuram' },
  '682001': { state: 'Kerala', district: 'Ernakulam' },
  '673001': { state: 'Kerala', district: 'Kozhikode' },
  '680001': { state: 'Kerala', district: 'Thrissur' },
  // Madhya Pradesh
  '462001': { state: 'Madhya Pradesh', district: 'Bhopal' },
  '452001': { state: 'Madhya Pradesh', district: 'Indore' },
  '482001': { state: 'Madhya Pradesh', district: 'Jabalpur' },
  '474001': { state: 'Madhya Pradesh', district: 'Gwalior' },
  // Andhra Pradesh
  '530001': { state: 'Andhra Pradesh', district: 'Visakhapatnam' },
  '520001': { state: 'Andhra Pradesh', district: 'Vijayawada' },
  '522001': { state: 'Andhra Pradesh', district: 'Guntur' },
  '517501': { state: 'Andhra Pradesh', district: 'Tirupati' },
  // Uttarakhand
  '248001': { state: 'Uttarakhand', district: 'Dehradun' },
  '263001': { state: 'Uttarakhand', district: 'Nainital' },
  '249401': { state: 'Uttarakhand', district: 'Haridwar' },
  // Goa
  '403001': { state: 'Goa', district: 'North Goa' },
  '403601': { state: 'Goa', district: 'South Goa' },
};

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  brand:       '#0a3d62',
  brandMid:    '#1565a8',
  accent:      '#00b894',
  accentLight: '#00cec9',
  textDark:    '#0a3d62',
  textMuted:   '#4a6278',
  textLight:   '#8fa8bc',
  border:      '#d0dce8',
  white:       '#ffffff',
  errBg:       '#fef2f2',
  errBorder:   '#fecaca',
  errText:     '#c0392b',
};

const makeStyles = (mob) => ({
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(150deg, #e8f4fd 0%, #f0f8ff 35%, #e8f9f5 70%, #f5fffc 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: mob ? '12px 16px 20px' : '16px 20px',
    position: 'relative', overflowX: 'hidden', overflowY: 'auto',
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  wrap: { position: 'relative', zIndex: 2, width: '100%', maxWidth: mob ? '100%' : 480 },
  brand: { textAlign: 'center', marginBottom: mob ? 6 : 10, paddingTop: 0 },
  logoBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: mob ? 2 : 4 },
  logoIcon: {
    width: mob ? 250 : 270, height: mob ? 150 : 180,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0, background: 'transparent',
  },
  brandSub: { color: C.textMuted, fontSize: mob ? 11.5 : 12.5, fontWeight: 300, letterSpacing: 0.3, marginBottom: 0 },
  card: {
    background: C.white, borderRadius: mob ? 14 : 18,
    padding: mob ? '20px 18px 18px' : '28px 32px',
    boxShadow: '0 20px 60px rgba(10,61,98,0.12)',
    border: '1px solid rgba(10,61,98,0.08)',
    position: 'relative', overflow: 'hidden',
  },
  cardAccentBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    background: `linear-gradient(90deg, ${C.brand}, ${C.brandMid}, ${C.accent})`,
  },
  welcomeBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'linear-gradient(135deg, rgba(10,61,98,0.06), rgba(0,184,148,0.06))',
    border: '1px solid rgba(10,61,98,0.12)', borderRadius: 20,
    padding: '4px 12px', fontSize: mob ? 11 : 12, color: C.textMuted,
    fontWeight: 500, marginBottom: mob ? 8 : 10,
  },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', background: C.accent, display: 'inline-block' },
  welcomeTitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: mob ? 20 : 24, color: C.textDark,
    marginBottom: mob ? 4 : 6, lineHeight: 1.2, fontWeight: 700,
  },
  welcomeDesc: { color: C.textMuted, fontSize: mob ? 12.5 : 13.5, marginBottom: mob ? 14 : 18, lineHeight: 1.5 },
  dividerOr: {
    display: 'flex', alignItems: 'center', gap: 12,
    color: C.textLight, fontSize: 12, margin: `${mob ? 8 : 10}px 0`,
  },
  dividerLine: { flex: 1, height: 1, background: C.border },
  btnBase: {
    width: '100%', padding: mob ? '13px 20px' : '12px 20px',
    borderRadius: 10, fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    fontSize: 15, fontWeight: 500, cursor: 'pointer', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  },
  btnPrimary: {
    background: `linear-gradient(135deg, ${C.brand}, ${C.brandMid})`,
    color: C.white, boxShadow: '0 4px 14px rgba(10,61,98,0.3)',
  },
  btnOutline: { background: 'transparent', color: C.textDark, border: `1.5px solid ${C.border}` },
  btnAccent: {
    background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
    color: C.white, boxShadow: '0 4px 14px rgba(0,184,148,0.3)',
  },
  btnGhost: {
    background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted,
    fontSize: 13, padding: '6px 0', display: 'inline-flex', alignItems: 'center', gap: 4,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  },
  secHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginBottom: mob ? 14 : 18, paddingBottom: mob ? 12 : 16,
    borderBottom: '1px solid #f0f4f8',
  },
  secTitle: { fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: mob ? 19 : 22, color: C.textDark, fontWeight: 700 },
  field: { marginBottom: mob ? 10 : 12 },
  fieldLabel: { display: 'block', fontSize: 11.5, fontWeight: 600, color: C.textMuted, marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' },
  fieldInput: {
    width: '100%', padding: mob ? '13px 14px' : '12px 14px',
    border: `1.5px solid ${C.border}`, borderRadius: 8,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    fontSize: mob ? 16 : 14.5, color: C.textDark, background: C.white,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
    WebkitAppearance: 'none',
  },
  fieldRow: { display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 0 : 12 },
  alertError: {
    padding: '11px 14px', borderRadius: 8, background: C.errBg,
    border: `1px solid ${C.errBorder}`, color: C.errText, fontSize: 13.5,
    display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12, lineHeight: 1.4,
  },
});

// ── SVG icons ─────────────────────────────────────────────────────────────────
function IcoArrowRight({ color = 'white' }) {
  return <svg width="16" height="16" fill={color} viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>;
}
function IcoArrowLeft() {
  return <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>;
}
function IcoAlert() {
  return <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>;
}
function IcoSpinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
function IcoCheck() {
  return <svg width="14" height="14" fill="none" stroke="#00b894" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>;
}
function IcoLocation() {
  return <svg width="14" height="14" fill="#00b894" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>;
}

// ── Simple text input ─────────────────────────────────────────────────────────
function FieldInput({ label, type = 'text', value, onChange, placeholder, inputMode, S, disabled, suffix }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={S.field}>
      <label style={S.fieldLabel}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} inputMode={inputMode} value={value} onChange={onChange}
          placeholder={placeholder} disabled={disabled}
          autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
          style={{
            ...S.fieldInput,
            borderColor: focused ? '#1565a8' : '#d0dce8',
            boxShadow: focused ? '0 0 0 3px rgba(21,101,168,0.1)' : 'none',
            opacity: disabled ? 0.6 : 1,
            paddingRight: suffix ? 36 : undefined,
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix && (
          <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Searchable dropdown ───────────────────────────────────────────────────────
function SearchDropdown({ label, value, onChange, options, placeholder, S, disabled }) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function select(opt) {
    onChange(opt);
    setQuery('');
    setOpen(false);
  }

  return (
    <div style={S.field} ref={ref}>
      <label style={S.fieldLabel}>{label}</label>
      <div style={{ position: 'relative' }}>
        {/* Display box */}
        <div
          onClick={() => { if (!disabled) { setOpen(o => !o); setQuery(''); } }}
          style={{
            ...S.fieldInput,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: disabled ? 'not-allowed' : 'pointer',
            borderColor: open ? '#1565a8' : focused ? '#1565a8' : '#d0dce8',
            boxShadow: open ? '0 0 0 3px rgba(21,101,168,0.1)' : 'none',
            opacity: disabled ? 0.6 : 1,
            userSelect: 'none',
            padding: '12px 14px',
          }}
        >
          <span style={{ color: value ? C.textDark : '#b8c8d8', fontSize: 14.5 }}>
            {value || placeholder}
          </span>
          <svg width="14" height="14" fill="#8fa8bc" viewBox="0 0 24 24"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </div>

        {/* Dropdown panel */}
        {open && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
            background: '#fff', border: '1.5px solid #d0dce8', borderRadius: 10,
            boxShadow: '0 10px 40px rgba(10,61,98,0.15)', marginTop: 4,
            maxHeight: 260, display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Search box inside dropdown */}
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #f0f4f8' }}>
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                style={{
                  width: '100%', padding: '8px 10px', border: '1.5px solid #d0dce8',
                  borderRadius: 7, fontSize: 13.5, outline: 'none', boxSizing: 'border-box',
                  fontFamily: "'DM Sans', sans-serif", color: '#0a3d62',
                }}
                onFocus={e => e.target.style.borderColor = '#1565a8'}
                onBlur={e => e.target.style.borderColor = '#d0dce8'}
              />
            </div>

            {/* Options list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#8fa8bc', fontSize: 13 }}>
                  No results found
                </div>
              ) : filtered.map(opt => (
                <div
                  key={opt}
                  onClick={() => select(opt)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', fontSize: 14,
                    color: opt === value ? '#1565a8' : '#0a3d62',
                    fontWeight: opt === value ? 700 : 400,
                    background: opt === value ? 'rgba(21,101,168,0.07)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid #f7f9fc',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = '#f4f8fc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = opt === value ? 'rgba(21,101,168,0.07)' : 'transparent'; }}
                >
                  {opt}
                  {opt === value && <IcoCheck />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pincode field with auto-fill ──────────────────────────────────────────────
function PincodeField({ value, onChange, onAutoFill, S, disabled }) {
  const [status, setStatus] = useState(null); // null | 'found' | 'not-found' | 'loading'

  function handleChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange(val);
    setStatus(null);

    if (val.length === 6) {
      setStatus('loading');
      setTimeout(() => {
        const match = PINCODE_DATA[val];
        if (match) {
          onAutoFill(match.state, match.district);
          setStatus('found');
        } else {
          setStatus('not-found');
        }
      }, 400);
    }
  }

  const borderColor = status === 'found' ? '#00b894' : status === 'not-found' ? '#e74c3c' : undefined;

  return (
    <div style={S.field}>
      <label style={S.fieldLabel}>Pincode</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text" inputMode="numeric" value={value} onChange={handleChange}
          placeholder="e.g. 141001" disabled={disabled} maxLength={6}
          style={{
            ...S.fieldInput,
            borderColor: borderColor || '#d0dce8',
            boxShadow: status === 'found' ? '0 0 0 3px rgba(0,184,148,0.12)' : 'none',
            paddingRight: 36,
          }}
          onFocus={e => { if (!borderColor) e.target.style.borderColor = '#1565a8'; }}
          onBlur={e => { if (!borderColor) e.target.style.borderColor = '#d0dce8'; }}
        />
        <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', lineHeight:1 }}>
          {status === 'loading' && <IcoSpinner />}
          {status === 'found'   && <IcoLocation />}
          {status === 'not-found' && <span style={{ fontSize:16 }}>❓</span>}
        </span>
      </div>
      {status === 'found' && (
        <div style={{ fontSize:11.5, color:'#00a878', fontWeight:600, marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
          <IcoCheck /> State & District auto-filled!
        </div>
      )}
      {status === 'not-found' && (
        <div style={{ fontSize:11.5, color:'#e74c3c', marginTop:4 }}>
          Pincode not found — please select state & district manually.
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { login } = useApp();
  const mob = useIsMobile();
  const S   = makeStyles(mob);

  const [mode,    setMode]    = useState(null);
  const [role,    setRole]    = useState('superadmin');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const [form, setForm] = useState({
    clinicName: '', ownerName: '', email: '',
    phone: '', whatsapp: '', address: '',
    pincode: '', city: '', district: '', state: '', password: '',
  });

  const f      = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const goBack = () => { setMode(null); setErr(''); };

  // Derived dropdown options
  const allStates    = Object.keys(INDIA_DATA).sort();
  const allDistricts = form.state && INDIA_DATA[form.state]
    ? Object.keys(INDIA_DATA[form.state].districts).sort()
    : [];
  const allCities = form.state && form.district && INDIA_DATA[form.state]?.districts[form.district]
    ? INDIA_DATA[form.state].districts[form.district].sort()
    : [];

  function handleStateChange(state) {
    setForm(p => ({ ...p, state, district: '', city: '' }));
  }
  function handleDistrictChange(district) {
    setForm(p => ({ ...p, district, city: '' }));
  }
  function handlePincodeAutoFill(state, district) {
    setForm(p => ({ ...p, state, district, city: '' }));
  }

  // ── Register ──────────────────────────────────────────────────────────────
  async function handleRegister() {
    setErr('');
    if (!form.clinicName || !form.ownerName || !form.email || !form.password) {
      setErr('Please fill in all required fields.'); return;
    }
    if (form.password.length < 6) {
      setErr('Password must be at least 6 characters.'); return;
    }
    setLoading(true);
    try {
      const data = await apiRegister(form);
      login({ type: 'admin', clinicId: data.clinicId, user: data.clinic });
    } catch (e) {
      setErr(e.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function handleLogin() {
    setErr('');
    if (!form.email || !form.password) {
      setErr('Please enter your email and password.'); return;
    }
    setLoading(true);
    try {
      const data = await apiLogin(role, form.email, form.password);
      login({ type: data.role, clinicId: data.clinicId, user: data.clinic || data.user || null });
    } catch (e) {
      setErr(e.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  const roles = [
    { key: 'superadmin',   label: '⭐  Super Admin'  },
    { key: 'admin',        label: '🔐  Clinic Admin'  },
    { key: 'receptionist', label: '📋  Receptionist'  },
    { key: 'doctor',       label: '👨‍⚕️  Doctor'        },
  ];

  return (
    <div style={{ ...S.page, ...(mode === null ? { height: '100vh', overflowY: 'hidden' } : {}) }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        @keyframes drift {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(20px,15px) scale(1.08); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #b8c8d8 !important; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        button, select, input { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* Decorative orbs */}
      {!mob && (
        <>
          <div style={{ position:'fixed', width:500, height:500, borderRadius:'50%', background:'#1565a8', filter:'blur(120px)', opacity:0.07, top:'-150px', right:'-150px', pointerEvents:'none', animation:'drift 8s ease-in-out 0s infinite alternate' }} />
          <div style={{ position:'fixed', width:400, height:400, borderRadius:'50%', background:'#00b894', filter:'blur(120px)', opacity:0.08, bottom:'-100px', left:'-100px', pointerEvents:'none', animation:'drift 11s ease-in-out 3s infinite alternate' }} />
        </>
      )}
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(10,61,98,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(10,61,98,0.04) 1px,transparent 1px)', backgroundSize:'50px 50px', pointerEvents:'none' }} />

      <div style={S.wrap}>
        {/* Brand header */}
        <div style={S.brand}>
          <div style={S.logoBox}>
            <div style={S.logoIcon}>
              <img src={curelexLogo} alt="Curelex Logo" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
            </div>
          </div>
          <div style={{ ...S.brandSub, marginBottom: mob ? 6 : 10 }}>Intelligent Patient Flow for Modern Clinics</div>
        </div>

        {/* ══════════ HOME ══════════ */}
        {!mode && (
          <div style={S.card}>
            <div style={S.cardAccentBar} />
            <div style={{ textAlign: 'center', marginBottom: mob ? 14 : 18 }}>
              <span style={S.welcomeBadge}><span style={S.badgeDot} /> Trusted by 500+ Clinics</span>
              <div style={S.welcomeTitle}>Welcome to Curelex</div>
              <div style={S.welcomeDesc}>Streamline patient queues, reduce wait times, and deliver a seamless clinic experience.</div>
            </div>
            <button style={{ ...S.btnBase, ...S.btnPrimary }} onClick={() => { setMode('register'); setErr(''); }}>
              Register Your Clinic <IcoArrowRight />
            </button>
            <div style={S.dividerOr}><div style={S.dividerLine} /> or <div style={S.dividerLine} /></div>
            <button style={{ ...S.btnBase, ...S.btnOutline }} onClick={() => { setMode('login'); setErr(''); }}>
              Sign in to Dashboard <IcoArrowRight color="#0a3d62" />
            </button>
          </div>
        )}

        {/* ══════════ REGISTER ══════════ */}
        {mode === 'register' && (
          <div style={S.card}>
            <div style={S.cardAccentBar} />
            <div style={S.secHeader}>
              <button style={S.btnGhost} onClick={goBack} disabled={loading}><IcoArrowLeft /> Back</button>
              <div style={S.secTitle}>Register Clinic</div>
            </div>

            <FieldInput S={S} label="Clinic Name *" value={form.clinicName} onChange={e => f('clinicName', e.target.value)} placeholder="e.g. City Medical Centre" disabled={loading} />
            <FieldInput S={S} label="Owner / Admin Name *" value={form.ownerName} onChange={e => f('ownerName', e.target.value)} placeholder="Full name" disabled={loading} />

            <div style={S.fieldRow}>
              <FieldInput S={S} label="Email Address *" type="email" inputMode="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="admin@clinic.com" disabled={loading} />
              <FieldInput S={S} label="Phone" type="tel" inputMode="tel" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="03xx-xxxxxxx" disabled={loading} />
            </div>

            {/* WhatsApp */}
            <div style={S.field}>
              <label style={S.fieldLabel}>WhatsApp Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, lineHeight:1, pointerEvents:'none' }}>💬</span>
                <input type="tel" inputMode="tel" value={form.whatsapp} onChange={e => f('whatsapp', e.target.value)}
                  placeholder="03xx-xxxxxxx (for patient communication)" disabled={loading}
                  style={{ ...S.fieldInput, paddingLeft: 36 }}
                  onFocus={e => { e.target.style.borderColor='#1565a8'; e.target.style.boxShadow='0 0 0 3px rgba(21,101,168,0.1)'; }}
                  onBlur={e  => { e.target.style.borderColor='#d0dce8'; e.target.style.boxShadow='none'; }}
                />
              </div>
            </div>

            <FieldInput S={S} label="Address" value={form.address} onChange={e => f('address', e.target.value)} placeholder="Street / Area / Sector" disabled={loading} />

            {/* ── Pincode (auto-fills state + district) ── */}
            <PincodeField
              value={form.pincode}
              onChange={v => f('pincode', v)}
              onAutoFill={handlePincodeAutoFill}
              S={S}
              disabled={loading}
            />

            {/* ── State dropdown ── */}
            <SearchDropdown
              label="State / Province"
              value={form.state}
              onChange={handleStateChange}
              options={allStates}
              placeholder="Select state…"
              S={S}
              disabled={loading}
            />

            {/* ── District dropdown (filtered by state) ── */}
            <SearchDropdown
              label="District"
              value={form.district}
              onChange={handleDistrictChange}
              options={allDistricts}
              placeholder={form.state ? 'Select district…' : 'Select state first'}
              S={S}
              disabled={loading || !form.state}
            />

            {/* ── City dropdown (filtered by district) ── */}
            <SearchDropdown
              label="City / Town"
              value={form.city}
              onChange={v => f('city', v)}
              options={allCities}
              placeholder={form.district ? 'Select city…' : 'Select district first'}
              S={S}
              disabled={loading || !form.district}
            />

            {/* Password */}
            <FieldInput S={S} label="Password *" type="password" value={form.password} onChange={e => f('password', e.target.value)} placeholder="Min. 6 characters" disabled={loading} />

            {err && <div style={S.alertError}><IcoAlert /> <span>{err}</span></div>}

            <button style={{ ...S.btnBase, ...S.btnAccent }} onClick={handleRegister} disabled={loading}>
              {loading ? <><IcoSpinner /> Creating Account…</> : <>Create Clinic Account <IcoArrowRight /></>}
            </button>

            <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:'#8fa8bc' }}>
              By registering, you agree to our Terms of Service
            </div>
          </div>
        )}

        {/* ══════════ LOGIN ══════════ */}
        {mode === 'login' && (
          <div style={S.card}>
            <div style={S.cardAccentBar} />
            <div style={S.secHeader}>
              <button style={S.btnGhost} onClick={goBack} disabled={loading}><IcoArrowLeft /> Back</button>
              <div style={S.secTitle}>Sign In</div>
            </div>

            <div style={S.field}>
              <label style={S.fieldLabel}>Login As</label>
              <select value={role} onChange={e => { setRole(e.target.value); setErr(''); }} disabled={loading}
                style={{
                  ...S.fieldInput,
                  cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24'%3E%3Cpath fill='%234a6278' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                  paddingRight: 40,
                }}>
                {roles.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>

            <FieldInput S={S} label="Email Address" type="email" inputMode="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="your@email.com" disabled={loading} />
            <FieldInput S={S} label="Password" type="password" value={form.password} onChange={e => f('password', e.target.value)} placeholder="Your password" disabled={loading} />

            {err && <div style={S.alertError}><IcoAlert /> <span>{err}</span></div>}

            <button style={{ ...S.btnBase, ...S.btnPrimary }} onClick={handleLogin} disabled={loading}>
              {loading ? <><IcoSpinner /> Signing In…</> : <>Sign In to Dashboard <IcoArrowRight /></>}
            </button>

            <div style={{ textAlign:'center', marginTop:14, fontSize:13 }}>
              <span style={{ color:'#8fa8bc' }}>New clinic?</span>{' '}
              <button style={{ ...S.btnGhost, color:'#1565a8', fontWeight:500, fontSize:13 }} onClick={() => { setMode('register'); setErr(''); }} disabled={loading}>
                Register here
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}