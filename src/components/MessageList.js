import React, { Component } from 'react';
import * as firebase from 'firebase';
import RoomList from './RoomList';

class MessageList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      currentRoom: this.props.currentRoom
    };
    this.messageRef = this.props.firebase.database().ref('messages');
    this.onlineRef = this.props.firebase.database().ref('signedInUsers');
    this.editMode = false;
    this.contextMenuForMsg = null;
    this.currentMsg = null;
    this.currentList = null;
    this.onlineStatusRecords = [];
    this.isTypingNew = false;
  }

  componentDidMount() {
    document.addEventListener('click', (e)=>{this.clicktoClose(e)});
    // set listener for users' online status
    this.onlineRef.on('value', (snapshot) => {
      var changed = false;
      var messages = this.state.messages.slice(0);
      this.onlineStatusRecords = snapshot.val();
      changed = this.updateOnlineStatus(messages);
      //console.log('Changed='+changed);
      if (changed) this.setState({ messages: messages });
    })
  }

  updateOnlineStatus(messages){
    var changed = false;
    var listofOnline = this.onlineStatusRecords!==null? Object.keys(this.onlineStatusRecords) : [];
    //console.log('in updateOnlineStatus: listofOnline='+listofOnline);

    for (let index in messages){
      //console.log('msg="'+messages[index].value.content+'" room='+messages[index].value.roomId);
      let foundIndex = listofOnline.indexOf(messages[index].value.uid);
      if ( foundIndex >=0) {
        //console.log('found the message author in the user-online list '+messages[index].value.username);
        if (messages[index].isOnline === false) {
          //console.log('This message author was not online')
          messages[index].isOnline = true;
          messages[index].isTyping = this.onlineStatusRecords[listofOnline[foundIndex]].isTyping;;
          changed = true;
        }
        else if (messages[index].isTyping !== this.onlineStatusRecords[listofOnline[foundIndex]].isTyping) {
          //console.log(`Typing status diff: messages[${index}].isTyping=${messages[index].isTyping}`);
          //console.log(`Typing status diff: records[listofOnline[${foundIndex}]].isTyping=${this.onlineStatusRecords[listofOnline[foundIndex]].isTyping}`);
          messages[index].isTyping = this.onlineStatusRecords[listofOnline[foundIndex]].isTyping;
          changed = true;
        }
      } else {
        //console.log('Msg author not on the online list!');
        if (messages[index].isOnline === true) {
          //console.log('...And he was online before...')
          messages[index].isOnline = false;
          messages[index].isTyping = 'false';
          changed = true;
        }
      }
    }
  return changed;
  }

  componentWillUnmount() {
    this.messageRef.off('value');
    this.onlineRef.off('value');
    document.removeEventListener('click', (e)=>{this.clicktoClose(e)});
  }

  //static getDerivedStateFromProps(nextProps, prevState) {
  componentDidUpdate(prevProps, prevState) {
    //console.log('in componentDidUpdate: thisState.msgs='+this.State.messages.toString())
    if (this.state.currentRoom !== this.props.currentRoom) {
      this.messageRef.off('value');
      let newState = {
        messages: [],
        currentRoom: this.props.currentRoom
      };
      if (this.props.currentRoom === null)
        this.setState(newState);
      else {
        this.messageRef.orderByChild('roomId').equalTo(this.props.currentRoom.key).on('value', (snapshot)=>{
        //console.log('value triggered! currRoom='+this.props.currentRoom.value);
          newState = {
            messages: [],
            currentRoom: this.props.currentRoom
          };
          this.loadCurrRoom(snapshot, newState.messages);
          if (newState.messages.length > 0) this.updateOnlineStatus(newState.messages);
          this.setState(newState);
        })
      }
    }
  }

  loadCurrRoom(snapshot, messages){
      const msgsObj = snapshot.val();
      for (let msgId in msgsObj){
        const msg = {
          key: msgId,
          value: msgsObj[msgId],
          isOnline: false,
          isTyping: 'false'
        }
        messages.push(msg);
      }
    }

  handleTextareaClick(){
    if (this.props.currentRoom === null || this.props.currentUser === null)
      return;

    const ref = this.props.firebase.database().ref('signedInUsers/'+this.props.currentUser.uid);
    ref.child('isTyping').set('true').then(()=>{
      this.isTypingNew = true;
    })
    .catch((error)=>{
      alert(`Setting isTyping true: errorMessage=${error.message} email=${error.email} credential=${error.credential}`);
    });
  }

  handleNewMsgSubmit(){
    if (this.props.currentRoom === null) {
      alert("Please select a room first.");
      return;
    } else if (this.props.currentUser === null) {
      alert("You have to sign in to post a message.");
      return;
    } else if (this.input.value.trim() === '') {
      return;
    }
    //clicktoClose() has already cleared the screen
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
      .then(()=> {
        this.input.value = '';
      })
      .catch((error)=> {
        alert(error.message);
      });
  }

  handleEditMsgSubmit(){
    const clickedMsgRef = this.props.firebase.database().ref('messages/'+this.currentMsg.key);
    clickedMsgRef.update({
      "content": this.input.value
    })
    .then(()=> {
      this.input.value = '';
      this.editMode = false;
      this.currentList.style.border = 'none';
      this.currentList = null;
    })
    .catch((error)=> {
      alert(error.message);
    });
  }

  handleMsgContext(e, msg){
    e.preventDefault();
    this.contextMenuForMsg.style.display = "block";
    this.contextMenuForMsg.style.top =  RoomList.mouseY(e, document) + 'px';
    this.contextMenuForMsg.style.left =  RoomList.mouseX(e, document) + 'px';
    this.currentMsg = msg;
    //remove old selection's border
    if (this.currentList != null)
      this.currentList.style.border = 'none';
    if (e.target.tagName === 'LI') this.currentList = e.target;
    else if (e.target.tagName === 'P') this.currentList = e.target.parentElement;
    else if (e.target.tagName === ('SPAN'||'DIV')) this.currentList = e.target.parentElement.parentElement;
  }

  validateAction(){
    this.input.value = '';
    if (this.props.currentUser === null) {
      alert("You have to sign in to post or edit a post.");
      return false;
    } else if (this.props.currentUser.displayName !== this.currentMsg.value.username){
      alert("You can only edit or delete your own posts.");
      return false;
    }
    return true;
  }

  deleteMsg(e){
    //console.log('in deleteMsg currentMsg='+this.currentMsg.value.content+' key='+this.currentMsg.key);
    if (this.validateAction() === false) return;

    const clickedMsgRef = this.props.firebase.database().ref('messages/'+this.currentMsg.key);
    clickedMsgRef.remove()
      .then(()=>{
        console.log("Remove succeeded.");
        this.currentMsg = null;})
      .catch(error=>{alert('delete message error: '+error.message)});
    // remove context menu no matter what
    this.contextMenuForMsg.style.display = 'none';
  }

  editMsg(e){
    //console.log(`in editMsg: currentMsg=${this.currentMsg.value.content} props.user.value=${this.props.currentUser.value} currentMsg.value.username=${this.currentMsg.value.username}`);
    if (this.validateAction() === false) return;
    this.input.value = this.currentMsg.value.content;
    this.input.focus();
    this.editMode = true;
    this.currentList.style.borderColor = 'red';
    this.currentList.style.borderStyle = 'dashed';
    this.currentList.style.borderWidth = '2px';
  }

  clicktoClose(e){
    //onClick event handler (if exists) is called before this

    // has chosen a context menu item
    if (e.target.parentElement === this.contextMenuForMsg) {
      //console.log('1.............');
      this.contextMenuForMsg.style.display = 'none';
    }
    else if (this.isTypingNew && e.target !== this.input && this.props.currentUser !== null){
      const ref = this.props.firebase.database().ref('signedInUsers/'+this.props.currentUser.uid);
      ref.child('isTyping').set('false').then(()=>{
        this.isTypingNew = false;
      })
      .catch((error)=>{
        alert(`Setting isTyping false: errorMessage=${error.message} email=${error.email} credential=${error.credential}`);
      });
    }
    //Clicking outside textarea and not the selected msg exits edit mode
    else if (this.editMode && e.target !== this.input && e.target !== this.currentList) {
      //console.log('2..........in clicktoClose: editMode, input='+this.input.value);
      this.input.value = '';
      this.editMode = false;
      this.currentList.style.border = 'none';
      this.contextMenuForMsg.style.display = 'none';
    }
    //clicking anywhere else when context menu is on closes the menu
    else if (this.contextMenuForMsg && this.contextMenuForMsg.style.display !== 'none'){
      //console.log('3..........');
      this.contextMenuForMsg.style.display = 'none';
    }
  }

  hiliteName(msg){
    if (msg.isOnline && msg.isTyping==='true') {
      return (
        <p className='msgHeader'>
          <span className='username' style={{color:'green'}}>{msg.value.username}<span className="tooltiptext">User is online</span></span>
          <div className='isTyping' style={{color:'gray',fontStyle:'Italic'}}> is typing......... </div>
          <span className='sentat'>{new Date(msg.value.sentAt).toLocaleDateString() +' '+ new Date(msg.value.sentAt).toLocaleTimeString()}</span>
        </p>)
    }
    else if (msg.isOnline && msg.isTyping!=='true') {
      return (
        <p className='msgHeader'>
          <span className='username' style={{color:'green'}}>{msg.value.username}<span className="tooltiptext">User is online</span></span>
          <span className='sentat'>{new Date(msg.value.sentAt).toLocaleDateString() +' '+ new Date(msg.value.sentAt).toLocaleTimeString()}</span>
        </p>)
    }
    else return (
      <p className='msgHeader'>
        <span className='username' style={{color:'purple'}}>{msg.value.username}<span className="tooltiptext">User is offline</span></span>
        <span className='sentat'>{new Date(msg.value.sentAt).toLocaleDateString() +' '+ new Date(msg.value.sentAt).toLocaleTimeString()}</span>
      </p>)
  }

  render(){
    //li don't need ref since onContextMenu has e.target
    //console.log('in render(): msgs='+this.state.messages.toString());
    return (
      <div>
      <section className = {this.props.className}>
        <h3>{this.props.currentRoom===null?'':this.props.currentRoom.value}</h3>
        <ul id='msgProper'>
          {
            this.state.messages.map( (msg) =>
            <li key={msg.key} tabIndex="0"
              onContextMenu= {(e)=>this.handleMsgContext(e, msg)}>
              {this.hiliteName(msg)}<br></br>
              <p className='content'>{msg.value.content}</p>
            </li>)
          }
        </ul>
        {/* right click menu */}
        <ul id='contextMsg' ref={(menu)=>this.contextMenuForMsg=menu}>
            <li onClick={(e)=>this.deleteMsg(e)}>Delete</li>
            <li onClick={(e)=>this.editMsg(e)}>Edit</li>
        </ul>
      </section>
      {/*new message textarea*/}
      <section className='newMessage'>
        <textarea name='new message'
          id='newMessage'
          row = '3'
          placeholder='Write your message here...'
          onClick={()=>this.handleTextareaClick()}
          ref={(input) => this.input = input}/>
        <button type='submit' id='newMessageSubmit'
          onClick={()=>this.editMode?this.handleEditMsgSubmit():this.handleNewMsgSubmit()}>Send</button>
      </section>
      </div>
    );
  }
};

export default MessageList;
