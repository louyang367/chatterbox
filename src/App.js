import React, { Component } from 'react';
import './App.css';
import * as firebase from 'firebase';
import RoomList from './components/RoomList';
import MessageList from './components/MessageList';
import User from './components/User';
import OnlineStatus from './components/OnlineStatus';

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
      currentUser: null,
      currentMsgs: [],
      onlineStatusRecords: []
    };
  }

  setCurrentRoom(currentRoom) {
    // console.log('app.js:setCurrentRoom:currentRoom=', currentRoom);
    this.setState({ currentRoom: currentRoom });
  }

  setUser(user) {
    this.setState({ currentUser: user });
  }

  setCurrentMsgs(msgs) {
    this.updateOnlineStatusForMsgs(msgs, this.state.onlineStatusRecords);
    this.setState({ currentMsgs: msgs });
  }

  setUserOnlineStatus(onlineStatusRecords) {
    let messages = this.state.currentMsgs.slice(0);
    let changed = this.updateOnlineStatusForMsgs(messages, onlineStatusRecords);
    //console.log('Changed='+changed);
    if (changed)
      this.setState({ currentMsgs: messages, onlineStatusRecords: onlineStatusRecords });
    else
      this.setState({ onlineStatusRecords: onlineStatusRecords });
  }

  updateOnlineStatusForMsgs(msgs, onlineStatusRecords) {
    let changed = false;
    let listofOnline = onlineStatusRecords ? Object.keys(onlineStatusRecords) : [];
    //console.log('in updateOnlineStatus: listofOnline='+listofOnline);

    for (let index in msgs) {
      //console.log('msg="'+msgs[index].value.content+'" room='+msgs[index].value.roomId);
      let foundIndex = listofOnline.indexOf(msgs[index].value.uid);
      if (foundIndex >= 0) {
        //console.log('found the message author in the user-online list '+msgs[index].value.username);
        if (msgs[index].isOnline === false) {
          //console.log('This message author was not online')
          msgs[index].isOnline = true;
          msgs[index].isTyping = onlineStatusRecords[listofOnline[foundIndex]].isTyping;
          changed = true;
        }
        else if (msgs[index].isTyping !== onlineStatusRecords[listofOnline[foundIndex]].isTyping) {
          //console.log(`Typing status diff: this.state.currentMsgs[${index}].isTyping=${msgs[index].isTyping}`);
          //console.log(`Typing status diff: records[listofOnline[${foundIndex}]].isTyping=${onlineStatusRecords[listofOnline[foundIndex]].isTyping}`);
          msgs[index].isTyping = onlineStatusRecords[listofOnline[foundIndex]].isTyping;
          changed = true;
        }
      } else {
        //console.log('Msg author not on the online list!');
        if (msgs[index].isOnline === true) {
          //console.log('...And he was online before...')
          msgs[index].isOnline = false;
          msgs[index].isTyping = 'false';
          changed = true;
        }
      }
    }
    return changed;
  }

  render() {
    //console.log("app.js render: currentRoom="+this.state.currentRoom+', currentUser='+this.state.currentUser);
    return (
      <div className="App">
        <header id="App-header" className="py-2 bg-info text-white">
          <div className="container">
            <div className="row">
              <div className="col-md-5">
                <span className='display-4'><i className="fa fa-comments"></i>
                  <span className='letter-c'>C</span><span className='letter-h'>h</span><span className='letter-a'>a</span><span className='letter-t'>t</span><span className='letter-t'>t</span><span className='letter-e'>e</span><span className='letter-r'>r</span><span className='letter-b'>B</span><span className='letter-b'>o</span><span className='letter-x'>x</span>
                </span>
              </div>
              <div className="col-md-2"></div>
              <div className="col-md-5 px=0">
                <User className="User"
                  firebase={firebase}
                  currentUser={this.state.currentUser}
                  setUser={(user) => this.setUser(user)}
                />
              </div>

            </div>
          </div>
        </header>

        <main>
          <div className="container mt-4">
            <div className="row">

              <div className="col-md-8 pr-3">
                <div className="row pr-3">
                  <MessageList className='MessageList'
                    firebase={firebase}
                    currentRoom={this.state.currentRoom}
                    currentUser={this.state.currentUser}
                    currentMsgs={this.state.currentMsgs}
                    setCurrentMsgs={(msgs) => this.setCurrentMsgs(msgs)}
                    key={this.state.currentRoom ? this.state.currentRoom.key : null}
                  />
                </div>
              </div>

              <div className="col-md-4" id='roomsProper'>

                <div className="row">
                  <OnlineStatus className="OnlineStatus p-2"
                    firebase={firebase}
                    onlineStatusRecords={this.state.onlineStatusRecords}
                    setUserOnlineStatus={(onlineStatusRecords) => this.setUserOnlineStatus(onlineStatusRecords)
                    }
                  />
                </div>
                <div className="row">
                  <RoomList className='RoomList'
                    firebase={firebase}
                    currentRoom={this.state.currentRoom}
                    currentUser={this.state.currentUser}
                    setCurrentRoom={(room) => this.setCurrentRoom(room)} />
                </div>
              </div>
            </div>
          </div>
        </main>

      </div >
    )
  }
}

export default App;
