import React, { Component } from 'react';
import * as firebase from 'firebase';

class MessageList extends Component {
  constructor(props) {
    super(props);
    this.input = null;
    this.messageRef = this.props.firebase.database().ref('messages');
    this.editInput = null;
    this.currentMsg = null;
  }

  componentDidMount() {
    // console.log('msgList.js:comptDidMt triggered. CurrRoom=', this.props.currentRoom);
    this.messageRef.off('value');
    if (this.props.currentRoom) {
      console.log('value triggered! currRoom=' + this.props.currentRoom.key);
      this.messageRef.orderByChild('roomId').equalTo(this.props.currentRoom.key).on('value', (snapshot) => {
        let currentMsgs = [];
        this.loadCurrMsgs(snapshot, currentMsgs);
        this.props.setCurrentMsgs(currentMsgs);
      })
    }
  }

  loadCurrMsgs(snapshot, messages) {
    const msgsObj = snapshot.val();
    for (let msgId in msgsObj) {
      const msg = {
        key: msgId,
        value: msgsObj[msgId],
        isOnline: false,
        isTyping: 'false'
      }
      messages.push(msg);
    }
  }

  componentWillUnmount() {
    if (this.messageRef) this.messageRef.off('value');
  }

  handleStartTyping() {
    if (!this.props.currentRoom || !this.props.currentUser)
      return;

    const ref = this.props.firebase.database().ref('signedInUsers/' + this.props.currentUser.uid);
    ref.child('isTyping').set('true').then(() => {
      console.log(`${this.props.currentUser.uid} isTyping set to true in firebase`)
    })
      .catch((error) => {
        alert(`Setting isTyping true: errorMessage=${error.message} email=${error.email} credential=${error.credential}`);
      });
  }

  handleNewMsgSubmit() {
    if (this.props.currentRoom === null) {
      alert("Please select a room first.");
      return;
    } else if (this.props.currentUser === null) {
      alert("You have to sign in to post a message.");
      return;
    } else if (this.input.value.trim() === '') {
      return;
    }

    const newMessage = {};
    newMessage.key = this.messageRef.push();

    newMessage.value = {
      sentAt: firebase.database.ServerValue.TIMESTAMP,
      roomId: this.props.currentRoom.key,
      username: this.props.currentUser.displayName,
      uid: this.props.currentUser.uid,
      content: this.input.value
    };

    newMessage.key.set(newMessage.value)
      .then(() => {
        this.input.value = '';
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  handleEditMsgSubmit(e) {
    // console.log('------inside handleEditMsgSubmit');
    if (this.validateAction() === false) return;
    const clickedMsgRef = this.props.firebase.database().ref('messages/' + this.currentMsg.key);
    clickedMsgRef.update({
      "content": this.editInput.value
    })
      .then(() => {
        this.editInput.value = 'Type something ...';
        e.preventDefault();
        document.getElementById("closeEditMsgModal").click();
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  validateAction() {
    if (this.props.currentUser === null) {
      alert("You have to sign in to post or edit a post.");
      return false;
    } else if (this.props.currentUser.displayName !== this.currentMsg.value.username) {
      alert("You can only edit or delete your own posts.");
      return false;
    }
    return true;
  }

  handleDeleteMsg(e) {
    //console.log('in deleteMsg currentMsg='+this.currentMsg.value.content+' key='+this.currentMsg.key);
    if (this.validateAction() === false) return;

    const clickedMsgRef = this.props.firebase.database().ref('messages/' + this.currentMsg.key);
    clickedMsgRef.remove()
      .then(() => {
        console.log("Remove succeeded.");
        this.currentMsg = null;
      })
      .catch(error => { alert('delete message error: ' + error.message) });
  }

  handleStopTyping() {
    //onClick event handler (if exists) is called before this

    if (this.props.currentUser) {
      const ref = this.props.firebase.database().ref('signedInUsers/' + this.props.currentUser.uid);
      ref.child('isTyping').set('false').then(() => {
        console.log(`${this.props.currentUser.uid} isTyping set to FALSE in firebase`)
      })
        .catch((error) => {
          alert(`Setting isTyping false: errorMessage=${error.message} email=${error.email} credential=${error.credential}`);
        });
    }
  }

  hiliteUserName(msg) {
    let date = new Date(msg.value.sentAt).toLocaleDateString();
    let time = new Date(msg.value.sentAt).toLocaleTimeString();

    if (msg.isOnline) return (
      <td className='userOnline'><div>{this.showTyping(msg)} <span className='text-success'>{msg.value.username}</span><span className="tooltiptext">User is online</span>
        <p><small className='text-muted'>{date} {time}</small>
        </p>
      </div></td>
    );
    else return (
      <td className='userOffline'><div>{this.showTyping(msg)} <span className='text-danger'>{msg.value.username}</span><span className="tooltiptext">User is offline</span>
        <p><small className='text-muted'>{date} {time}</small>
        </p>
      </div></td>
    )
  }

  showTyping(msg) {
    if (msg.isOnline && msg.isTyping === 'true') {
      return (
        <i className="fas fa-spinner fa-spin text-warning font-weight-bold"></i>
      )
    }
  }

  showRoomCreator() {
    if (this.props.currentRoom) {
      return <small className='pl-1 font-italic'> (Created by {this.props.currentRoom.createdBy})</small>
    }
  }

  render() {
    //li don't need ref since onContextMenu has e.target
    //console.log('in render(): msgs='+this.state.messages.toString());

    return (
      <div>
        {/* {console.log('props.key=', this.props.key, " curRoom=", this.props.currentRoom)} */}
        <section className={this.props.className}>
          <div className="RoomName mb-4 bg-light">
            
            <h3 className='pl-1 display-5 text-primary'>{this.props.currentRoom ? this.props.currentRoom.name : ''}</h3>
            {this.showRoomCreator()}
          </div>
          <table className="table table-sm table-hover" style={{ tableLayout: 'fixed', wordWrap: 'break-word' }}>
            <colgroup style={{ width: '100%' }}>
              <col style={{ width: '20%' }} />
              <col style={{ width: '70%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>

            <tbody>
              {
                this.props.currentMsgs.map((msg) =>
                  <tr key={msg.key}>
                    {this.hiliteUserName(msg)}
                    <td><div>{msg.value.content}</div></td>
                    <td><div> <a href="#" className="btn btn-outline-info btn-block" data-toggle="modal" data-target="#chatDetailModal" onClick={() => {
                      this.currentMsg = msg;
                      this.editInput.value = msg.value.content;
                    }}><i className="fas fa-angle-double-right"></i></a></div></td>
                  </tr>)
              }
            </tbody>
          </table>
        </section>

        {/*new message textarea*/}
        <section className='newMessage mt-2 text-center'>
          <textarea className='form-control border-info'
            id='newMessage'
            rows='5'
            placeholder='Write your message here...'
            ref={(input) => this.input = input}
            onFocus={() => this.handleStartTyping()}
            onBlur={() => this.handleStopTyping()} />
          <button className="btn btn-primary float-right mt-1" id='newMessageSubmit'
            onClick={() => this.handleNewMsgSubmit()}>Send</button>
        </section>

        {/* Chat detail MODAL */}
        <div className="modal fade" id="chatDetailModal">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Edit message</h5>
                <button id='closeEditMsgModal' className="close" data-dismiss="modal">
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form id='formToEditMsg'>
                  <div className="form-group">
                    <textarea id='editMsgTA' rows='5' className="form-control" required
                      ref={(input) => this.editInput = input}> </textarea>
                  </div>
                  <button className="btn btn-primary" onClick={(e) => this.handleEditMsgSubmit(e)}>Update Message</button>
                  <button className="btn btn-warning ml-3" onClick={(e) => this.handleDeleteMsg(e)}>Delete Message</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default MessageList;
