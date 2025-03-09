import express from 'express';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import multer from 'multer';
import ejs from 'ejs';

// Derive __dirname from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configure session management
app.use(session({
    secret: 'your_secret_key', // Change to a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Set up EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views')); // Assumes views are in the 'views' directory

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, join(__dirname, 'public/uploads')); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Unique file name
    }
});
const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mydatabase')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define User schema and model
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
});
const User = mongoose.model('User', userSchema);

// Define Profile schema and model
const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    firstName: String,
    lastName: String,
    email: String,
    profilePic: String, // Field to store the profile picture path
    resume: String // Field to store the resume file path
});
const Profile = mongoose.model('Profile', profileSchema);

// Define Business schema and model
const businessSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: true,
        trim: true
    },
    emailAddress: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
});
const Business = mongoose.model('Business', businessSchema);

// Serve static files (assuming static files are in the 'public' directory)
app.use(express.static(join(__dirname, 'public')));
app.use('/uploads', express.static(join(__dirname, 'public/uploads')));

// Route to display the homepage
app.get('/home', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    try {
        const profile = await Profile.findOne({ userId: req.session.userId }).exec();
        if (!profile) {
            return res.status(404).send('Profile not found');
        }
        res.render('homepage', { profile });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send('Error fetching profile');
    }
});

// Route to display the frontpage
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'finalwebsite.html'));
});

// Route to display the login page
app.get('/login', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'finallogin.html'));
});

// Route to display the registration page
app.get('/register', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'registerpage.html'));
});

// Route to display the business registration page
app.get('/business-register', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'businessregister.html'));
});

// Route to display the profile creation page
app.get('/create-profile', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(join(__dirname, 'public', 'profile.html'));
});

// Route to display the edit profile page
app.get('/edit-profile', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    try {
        const profile = await Profile.findOne({ userId: req.session.userId }).exec();
        if (!profile) {
            return res.status(404).send('Profile not found');
        }
        res.sendFile(join(__dirname, 'public', 'edit-profile.html'));
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send('Error fetching profile');
    }
});

// Handle user registration with profile image
app.post('/register', upload.single('profileImage'), async (req, res) => {
    const { username, password, firstName, lastName, email } = req.body;
    const profileImage = req.file ? req.file.path : undefined; // Get the path of the uploaded profile image

    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        const newProfile = new Profile({
            userId: newUser._id,
            firstName,
            lastName,
            email,
            profilePic: profileImage
        });
        await newProfile.save();

        req.session.userId = newUser._id;

        res.redirect('/login');
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).send('Error saving user');
    }
});

// Route to handle user login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send('Invalid credentials');
        }

        req.session.userId = user._id;
        res.redirect('/home');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Login error');
    }
});

app.post('/business-register', async (req, res) => {
    const { businessName, emailAddress, contactNumber, username, password } = req.body;

    if (!businessName || !emailAddress || !contactNumber || !username || !password) {
        return res.status(400).send('All fields are required');
    }

    try {
        const existingBusiness = await Business.findOne({ emailAddress });
        if (existingBusiness) {
            return res.status(400).send('Business with this email address already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newBusiness = new Business({
            businessName,
            emailAddress,
            contactNumber,
            username,
            password: hashedPassword
        });

        await newBusiness.save();

        req.session.businessId = newBusiness._id;
        res.redirect('/home');
    } catch (error) {
        console.error('Error saving business:', error);
        res.status(500).send(`Error saving business: ${error.message}`);
    }
});

// Route to display user profile
app.get('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    try {
        const profile = await Profile.findOne({ userId: req.session.userId }).exec();
        if (profile) {
            res.send(
                `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Profile</title>
                </head>
                <body>
                    <h1>Profile</h1>
                    <img src="${profile.profilePic || '/profile-icon.png'}" alt="Profile Icon" style="width: 100px; height: 100px;">
                    <p><strong>First Name:</strong> ${profile.firstName}</p>
                    <p><strong>Last Name:</strong> ${profile.lastName}</p>
                    <p><strong>Email:</strong> ${profile.email}</p>
                    <p><strong>Resume:</strong> ${profile.resume ? `<a href="${profile.resume}">Download</a>` : 'No resume uploaded'}</p>
                    <a href="/home">Go to Home</a>
                </body>
                </html>`
            );
        } else {
            res.status(404).send('Profile not found');
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send('Error fetching profile');
    }
});

// Route to handle profile updates
app.post('/update-profile', upload.single('resume'), async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send('You must be logged in to update your profile');
    }

    const { firstName, lastName } = req.body;
    const resumePath = req.file ? req.file.path : undefined;

    try {
        const profile = await Profile.findOne({ userId: req.session.userId });
        if (profile) {
            profile.firstName = firstName || profile.firstName;
            profile.lastName = lastName || profile.lastName;
            if (resumePath) {
                profile.resume = resumePath; // Update resume path
            }
            await profile.save();
            res.redirect('/profile');
        } else {
            res.status(404).send('Profile not found');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Error updating profile');
    }
});

// Route to handle profile picture upload
app.post('/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send('You must be logged in to upload a profile picture');
    }

    try {
        const profile = await Profile.findOne({ userId: req.session.userId });
        if (profile) {
            profile.profilePic = req.file.path; // Store the file path in the profile
            await profile.save();
            res.redirect('/profile');
        } else {
            res.status(404).send('Profile not found');
        }
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).send('Error uploading profile picture');
    }
});

// Route to display the booking form
app.get('/booking', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'bookingpage.html'));
});

// Define Booking schema and model
const bookingSchema = new mongoose.Schema({
    fullName: String,
    experience: Number,
    jobApplyingFor: String,
    selectDate: Date
});
const Booking = mongoose.model('Booking', bookingSchema);

// Route to handle booking submissions
app.post('/booking', async (req, res) => {
    const { fullName, experience, jobApplyingFor, selectDate } = req.body;

    if (!fullName || !experience || !jobApplyingFor || !selectDate) {
        return res.status(400).send('All fields are required');
    }

    const experienceNumber = parseInt(experience, 10);
    if (isNaN(experienceNumber) || experienceNumber < 0) {
        return res.status(400).send('Experience must be a non-negative number');
    }

    try {
        const newBooking = new Booking({
            fullName,
            experience: experienceNumber,
            jobApplyingFor,
            selectDate: new Date(selectDate)
        });
        await newBooking.save();
        res.redirect('/home');
    } catch (error) {
        console.error('Error saving booking:', error);
        res.status(500).send('Error saving booking');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
