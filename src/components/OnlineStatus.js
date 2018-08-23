import React, { Component } from 'react';
import * as firebase from 'firebase';

class OnlineStatus extends Component {
  constructor(props) {
    super(props);
    this.onlineStatusRef = firebase.database().ref('signedInUsers');
    this.listofOnlineUsers = [];
  }

  componentDidMount() {
    this.onlineStatusRef.on('value', (snapshot) => {
      // console.log('user.js: onlineStatusRef triggered');
      this.props.setUserOnlineStatus(snapshot.val());
    })
  }

  componentWillUnmount() {
    this.state.onlineStatusRef.off('value');
  }

  totalOnlineUsers() {
    return this.listofOnlineUsers.length;
  }

  totalWhosTyping() {
    let accum = 0;
    for (let key in this.props.onlineStatusRecords) {
      if (this.props.onlineStatusRecords[key].isTyping === 'true') {
        accum++;
      }
    }
    return accum;
  }

  render() {
    this.listofOnlineUsers = this.props.onlineStatusRecords ? Object.keys(this.props.onlineStatusRecords) : [];

    return (
      <div className={this.props.className}>

        <p className="text-center text-primary">
          <span className="num-online mx-5">
            <i className="fas fa-users"></i><span className="badge badge-primary badge-pill">{this.totalOnlineUsers()}</span><span className="tooltiptext">Number of users online</span>
          </span>
          <span className="num-typing mx-5">
             <i className="far fa-keyboard"></i><span className="badge badge-primary badge-pill">{this.totalWhosTyping()}</span><span className="tooltiptext">Users of current room who are typing</span>
          </span>
        </p>
      </div>
    )

  }
};

export default OnlineStatus;
