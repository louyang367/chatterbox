import React, { Component } from 'react';
import './App.css';
import * as firebase from 'firebase';
import RoomList from './components/RoomList';
import MessageList from './components/MessageList';
import User from './components/User';

// Initialize Firebase
// <script src="https://www.gstatic.com/firebasejs/5.2.0/firebase.js"></script>

var config = {
  apiKey: "AIzaSyDqwX_WNEyLyplqu6AnX2KarIABeJ53aeM",
  authDomain: "chatterbox-5bb37.firebaseapp.com",
  databaseURL: "https://chatterbox-5bb37.firebaseio.com",
  projectId: "chatterbox-5bb37",
  storageBucket: "",
  messagingSenderId: "31532366700"
};
firebase.initializeApp(config);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentRoom: null,
      currentUser: null
    };
  }

  setCurrentRoom(currentRoom) {
    if (currentRoom !== this.state.currentRoom) {
      //console.log('app.js:setCurrentRoom: '+currentRoom)
      this.setState({ currentRoom: currentRoom });
    }
  }

  setUser(user) {
    if (user !== this.state.currentUser) {
      this.setState({ currentUser: user });
    }
  }

  render() {
    //console.log("app.js render: currentRoom="+this.state.currentRoom+', currentUser='+this.state.currentUser);
    return (
      <div className="App">
        <header className="App-header">
        </header>
        <nav>
          <RoomList className='RoomList'
            firebase={firebase}
            currentRoom={this.state.currentRoom}
            setCurrentRoom={(room) => this.setCurrentRoom(room)} />
        </nav>
        <main>
          <MessageList className='MessageList'
            firebase={firebase}
            currentRoom={this.state.currentRoom}
            currentUser={this.state.currentUser}
          />
        </main>
        <footer>
          <User className="User"
            firebase={firebase}
            currentUser={this.state.currentUser}
            setUser={(user) => this.setUser(user)}
          />
        </footer>
      </div>
    )
  }
}

export default App;
