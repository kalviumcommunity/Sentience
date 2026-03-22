# [Student Sentience - Comprehensive Study Management Platform](https://sentiencehub.netlify.app/)

A modern, full-stack web application designed to help students manage their academic life with features for task tracking, study planning, focus sessions, mood tracking, and analytics.

## 🚀 Features

### ✅ Core Functionality
- **Task Management**: Create, organize, and track tasks with priority levels and status tracking
- **Study Planning**: Schedule and track study sessions with detailed notes and time management
- **Focus Mode**: Pomodoro timer with customizable work/break intervals and distraction blocking
- **Mood Tracking**: Daily mood logging with insights and patterns
- **Analytics Dashboard**: Comprehensive analytics showing productivity trends and patterns
- **Notes Hub**: Create, share, and discover study notes with community features

### ✅ User Experience
- **Modern UI**: Beautiful, responsive interface with dark/light theme support
- **Real-time Data**: Live updates and synchronization across devices
- **Data Persistence**: MongoDB backend with localStorage fallback
- **Authentication**: Secure JWT-based authentication system
- **Profile Management**: Complete user profiles with academic information

### ✅ Advanced Features
- **Data Export/Import**: Backup and restore your data
- **Search Functionality**: Global search across all content
- **Notifications**: Smart notification system for reminders
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 🚀 Features

### ✅ Core Functionality
- **Real Website Blocking**: Actually blocks websites at the browser level
- **Timer-Based Sessions**: Set custom durations for your study sessions
- **Persistent Timer**: Timer continues even after browser restart
- **Visual Progress**: Beautiful circular progress indicator
- **Badge Updates**: Extension badge shows remaining time

### ✅ Smart Blocking
- **Category-Based Blocking**: Quick add social media, entertainment, or news sites
- **Custom Sites**: Add any website to your block list
- **Flexible Duration**: Set blocking duration from 5 minutes to 3 hours
- **Real-time Monitoring**: Monitors all tabs and navigation

### ✅ User Experience
- **Beautiful UI**: Modern, clean interface with smooth animations
- **Motivational Messages**: Encouraging blocked page with progress tracking
- **Notifications**: Desktop notifications when sessions start/end
- **Easy Management**: Simple popup interface for all controls

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Development Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd student-sentience-20-main
   ```

2. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment example
   cp server/.env.example server/.env
   
   # Edit server/.env with your configuration:
   # MONGODB_URI=mongodb://localhost:27017/Capstone
   # JWT_SECRET=your-super-secret-jwt-key
   # PORT=8000
   ```

4. **Start the Application**
   ```bash
   # Start backend server (in server directory)
   cd server
   npm start
   
   # Start frontend (in root directory)
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

### Production Deployment

#### Live Application
- **🌐 Live Demo**: [https://sentiencehub.netlify.app/](https://sentiencehub.netlify.app/)
- **🔧 Backend API**: [https://sentience-xq1s.onrender.com](https://sentience-xq1s.onrender.com)

#### Local Deployment
Use Docker Compose for easy deployment:

```bash
# Build and start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

#### Cloud Deployment
- **Frontend**: Deployed on Netlify
- **Backend**: Deployed on Render
- **Database**: MongoDB Atlas

## 🎯 Usage Guide

### Getting Started

1. **Create an Account**
   - Sign up with your email and academic information
   - Complete your profile with university, major, and year

2. **Explore the Dashboard**
   - Navigate through different sections using the navbar
   - Each section is designed for specific academic needs

3. **Start with Task Management**
   - Create your first task in the Task Tracker
   - Set priorities and due dates
   - Track progress through different statuses

### Core Features

#### Task Tracker
- **Create Tasks**: Add tasks with titles, descriptions, and priorities
- **Organize**: Use tags and categories to organize your work
- **Track Progress**: Move tasks between To Do, In Progress, and Done
- **Set Reminders**: Add due dates and estimated completion times

#### Study Planner
- **Schedule Sessions**: Plan study sessions with subjects and durations
- **Track Time**: Log actual study time and compare with planned time
- **Add Notes**: Include detailed notes about what you studied
- **View History**: See your study patterns and progress

#### Focus Mode
- **Pomodoro Timer**: Use the built-in timer for focused work sessions
- **Custom Intervals**: Set work and break durations
- **Distraction Blocking**: Enable website blocking during focus sessions
- **Track Sessions**: Monitor completed focus sessions and productivity

#### Mood Tracker
- **Daily Logging**: Record your mood throughout the day
- **Add Notes**: Include context about what affected your mood
- **View Patterns**: See mood trends and correlations with productivity
- **Insights**: Get personalized insights about your well-being

#### Analytics Dashboard
- **Productivity Metrics**: View task completion rates and study time
- **Mood Trends**: See patterns in your emotional well-being
- **Focus Statistics**: Track focus session effectiveness
- **Personal Insights**: Get recommendations for improvement

#### Notes Hub
- **Create Notes**: Write and organize study notes
- **Share Knowledge**: Share notes with the community
- **Discover Content**: Find notes from other students
- **Collaborate**: Like and comment on shared notes

### Advanced Features

#### Data Management
- **Export Data**: Download your data as JSON backup
- **Import Data**: Restore from previous backups
- **Clear Data**: Reset your account if needed
- **Storage Monitoring**: Track your data usage

#### Profile Management
- **Academic Info**: Update university, major, and year
- **Avatar System**: Customize your profile picture
- **Privacy Settings**: Control what information is shared
- **Account Security**: Manage authentication and passwords
- **Notifications**: Desktop notifications when session ends
- **Persistent**: Timer continues even if you close popup

### Stopping Early

- Click "Stop Blocker" in the popup
- Timer will reset and sites will be unblocked
- No penalty for stopping early

## 🔧 Technical Details

### Architecture

```
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/             # Main application pages
│   ├── contexts/          # React context providers
│   ├── services/          # API and utility services
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── utils/             # Helper functions
├── server/                 # Backend source code
│   ├── routes/            # API route handlers
│   ├── models/            # MongoDB schemas
│   ├── middleware/        # Express middleware
│   └── server.js          # Main server file
├── public/                 # Static assets
├── docker-compose.yml      # Docker deployment
├── Dockerfile              # Frontend container
└── server/Dockerfile       # Backend container
```

### Key Features

- **Full-Stack**: React frontend with Node.js backend
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based secure authentication
- **Real-time**: Live updates and data synchronization
- **Responsive**: Works on desktop and mobile devices

## 🛡️ Security & Privacy

- **JWT Authentication**: Secure token-based authentication
- **Data Encryption**: Sensitive data is properly encrypted
- **Input Validation**: All user inputs are validated
- **CORS Protection**: Cross-origin requests are properly handled
- **Environment Variables**: Sensitive configuration is externalized

## 🎨 Customization

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component library
- **Theme Support**: Dark and light mode
- **Responsive Design**: Mobile-first approach

### Adding New Features
The application is built with a modular architecture:
- **Frontend**: Add new pages in `src/pages/`
- **Backend**: Add new routes in `server/routes/`
- **Database**: Add new models in `server/models/`

## 🐛 Troubleshooting

### Common Issues

1. **Backend Not Starting**
   - Check MongoDB is running
   - Verify environment variables
   - Check server logs for errors

2. **Frontend Not Loading**
   - Ensure backend is running on port 8000
   - Check for CORS issues
   - Verify API endpoints are accessible

3. **Database Connection Issues**
   - Check MongoDB connection string
   - Verify database permissions
   - Check network connectivity

4. **Authentication Problems**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper headers are sent

### Debug Mode

1. **Frontend**: Check browser console for errors
2. **Backend**: Check server logs for API errors
3. **Database**: Use MongoDB Compass to inspect data
4. **Network**: Use browser dev tools to check API calls

## 📝 Development

### File Structure
```
student-sentience-20-main/
├── src/
│   ├── components/
│   ├── pages/
│   ├── contexts/
│   ├── services/
│   └── utils/
├── server/
│   ├── routes/
│   ├── models/
│   └── middleware/
└── public/
```

### Testing
1. Load extension in Chrome
2. Add test sites to block list
3. Start a short session (1-2 minutes)
4. Try accessing blocked sites
5. Verify timer and notifications work

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with Chrome Extension Manifest V3
- Inspired by productivity and focus tools
- Designed for students and professionals

---

**Happy Studying! 🎓**

Stay focused, stay productive with StudyHub Distraction Blocker.
