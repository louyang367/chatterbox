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
        <div className='row'>
          <div className="col">

            <div className="card border-0 bg-info text-center text-white">
              <div className="card-body">
                <h5>Users online:</h5>
                <h3><i className="fas fa-users"></i> <span className="badge badge-primary badge-pill">{this.totalOnlineUsers()}</span></h3>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card border-0 bg-info text-center text-white">
              <div className="card-body">
                <h5>Users who are typing right now:</h5>
                <h3><i className="far fa-keyboard"></i> <span className="badge badge-primary badge-pill">{this.totalWhosTyping()}</span></h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

  }
};

export default OnlineStatus;
