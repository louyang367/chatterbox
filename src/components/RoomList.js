import React, { Component } from 'react';

class RoomList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rooms: []
    };
    this.roomsRef = this.props.firebase.database().ref('rooms');
    this.modal = null;
    this.contextMenuForRoom = null;
    this.newRoomInput = null;
    this.renameRoomInput = null;
    this.roomInput = null;
    this.formToCreateRoom = null;
    this.formToRenameRoom = null;
  }

  ignoreEnterKey (e) {
    if ( (e.keyIdentifier==='U+000A'||e.keyIdentifier==='Enter'||e.keyCode===13)
      && (e.target.nodeName==='INPUT' && e.target.type==='text') ){
        e.preventDefault();
      }
  }

  clicktoClose(){
    if (this.contextMenuForRoom)
      this.contextMenuForRoom.style.display = 'none';
  }

  loadSnapshot(snapshot){
    const roomsObj = snapshot.val();
    let rooms = [];
    for (let roomId in roomsObj){
      const aRoom = {};
      aRoom.key = roomId;
      aRoom.value = roomsObj[roomId];
      rooms.push(aRoom);
    }
    this.setState( {rooms: rooms} );
  }

  componentDidMount() {
    this.roomsRef.on('value', snapshot => this.loadSnapshot(snapshot));
    document.addEventListener('keydown', this.ignoreEnterKey);
    document.addEventListener('click', ()=>{this.clicktoClose()});
    }

  componentWillUnmount() {
    this.roomsRef.off('value', this.loadSnapshot);
    document.removeEventListener('keydown', this.ignoreEnterKey);
    document.removeEventListener('click', ()=>{this.clicktoClose()});
  }

  handleRoomFormClick(){
    this.modal.style.display = "block";
    this.modal.style.zIndex = 1;
    this.roomInput.focus();
    this.contextMenuForRoom.style.display = 'none';
  }

  handleCloseRoomFormClick(){
    this.modal.style.display = "none";
    this.modal = null;
    this.roomInput = null;
  }

  validateName(e, newName){
    if (newName===null || newName.length===0 || newName.trim()==='') {
      alert("Please enter a valid name.");
      this.modal.style.display = "block";
      e.preventDefault();
      return false; }
    else return true;
  }

  createRoom(e){
    const val = this.newRoomInput.value;//(document.forms['formToCreateRoom']['inputRoomName'].value);

    if (this.validateName(e, val)) {
      const newRef = this.roomsRef.push();
      newRef.set(val);
      e.preventDefault();
      this.props.setCurrentRoom( {key: newRef.key, value: this.newRoomInput.value} );
      this.handleCloseRoomFormClick();
      this.newRoomInput.value = null;
    }
  }

  renameRoom(e){
    const val = this.renameRoomInput.value;
    if (this.validateName(e, val)) {
    //console.log('val= '+val+' val.trim()=|'+val.trim()+'|');
      const update = {};
      update['rooms/'+this.props.currentRoom.key] = this.renameRoomInput.value;
      this.props.firebase.database().ref().update(update)
      .then(()=>{/*console.log("Rename succeeded.")*/})
      .catch(error=>{console.log(error.message)});
      e.preventDefault();
      this.props.setCurrentRoom( {key: this.props.currentRoom.key, value: this.renameRoomInput.value} );
      this.renameRoomInput.value = null;
      this.handleCloseRoomFormClick();
    }
  }

  deleteRoom(){
    const clickedRoomRef = this.props.firebase.database().ref('rooms/'+this.props.currentRoom.key);
    clickedRoomRef.remove()
      .then(/*()=>console.log("Remove succeeded.")*/)
      .catch(error=>{console.log(error.message)});
    this.props.setCurrentRoom(null);
    this.contextMenuForRoom.style.display = 'none';
  }

  static mouseX(evt, document) {
    if (evt.pageX) {
      return evt.pageX; }
    else if (evt.clientX) {
      return evt.clientX + (document.documentElement.scrollLeft ?
        document.documentElement.scrollLeft :
        document.body.scrollLeft); }
    else {
      return null; }
  }

  static mouseY(evt, document) {
    if (evt.pageY) {
      return evt.pageY; }
    else if (evt.clientY) {
      return evt.clientY + (document.documentElement.scrollTop ?
        document.documentElement.scrollTop :
        document.body.scrollTop); }
    else {
      return null; }
  }

  handleRoomContext(e, room){
    e.preventDefault();
    this.props.setCurrentRoom(room);
    this.contextMenuForRoom.style.display = "block";
    this.contextMenuForRoom.style.top =  RoomList.mouseY(e, document) + 'px';
    this.contextMenuForRoom.style.left =  RoomList.mouseX(e, document) + 'px';
  }

  hiliteRoom(room, index){
    const highLight = {backgroundColor:'#c9ddfc', color:'black',borderStyle:'groove',borderColor:'c9ddfc',borderLeft:'None',borderRight:'none'};//#4284F9
    const plain = {backgroundColor:'lightgray', color:'black'};
    if (this.props.currentRoom!=null && room.key===this.props.currentRoom.key)
      return <li key={room.key} onClick={()=>this.props.setCurrentRoom(room)}
        style={highLight}
        onContextMenu= {(e)=>this.handleRoomContext(e, room)}
      >{room.value}</li>
    else {
      return <li key={room.key} onClick={()=>this.props.setCurrentRoom(room)}
        style={plain}
        onContextMenu= {(e)=>this.handleRoomContext(e, room)}
      >{room.value}</li>;
    }
  }

  render(){
    //console.log("roomList.js render: props.currentRoom="+this.props.currentRoom);
    //console.log("roomList.js render: props.className="+this.props.className);
    return (
      <div className = {this.props.className}>
        <h1 className="App-title">Chatterbox</h1>
        {/* button to create new room */}
        <button type='button'
          name='New room' id='newRoom'
          onClick={()=>{
            this.modal=this.formToCreateRoom;
            this.roomInput=this.newRoomInput;
            this.handleRoomFormClick()}}> New room </button>
        {/* form to create new room. No checking for duplication. */}
        <form name = 'formToCreateRoom' id='formToCreateRoom'
          ref={(form)=>{this.formToCreateRoom=form}}
          onSubmit={(e)=>this.createRoom(e)}>
          <fieldset>
            <h3>Create New Room</h3>
            <label>Enter a room name
              <input type='text' name='inputRoomName' ref={input=>this.newRoomInput=input}/>
            </label>
            <div className='buttons'>
              <button type='reset' value='Cancel' onClick={()=>this.handleCloseRoomFormClick()}>Cancel</button>
              <button type='submit' value='Create'>Create</button>
            </div>
          </fieldset>
        </form>
        {/* list of existing rooms */}
        <ul id='roomsProper'>
          {
            this.state.rooms.map( (room, index) => this.hiliteRoom(room, index)
          )}
        </ul>
        {/* right click menu */}
        <div>
          <ul id='contextRoom' ref={(menu)=>this.contextMenuForRoom=menu}>
            <li onClick={(e)=>this.deleteRoom(e)}>Delete</li>
            <li onClick={(e)=>{
                this.modal=this.formToRenameRoom;
                this.roomInput=this.renameRoomInput;
                this.handleRoomFormClick()}}>Rename</li>
          </ul>
        </div>
        {/* form to enter new room name. No checking for duplication. */}
        <form name = 'formToRenameRoom' id='formToRenameRoom'
          ref={(form)=>{this.formToRenameRoom=form}}
          onSubmit={(e)=>this.renameRoom(e)}>
          <fieldset>
            <h3>Rename the Room</h3>
            <label>Enter a new room name
              <input type='text' name='newRoomName' ref={input=>this.renameRoomInput=input}/>
            </label>
            <div className='buttons'>
              <button type='reset' value='Cancel' onClick={()=>this.handleCloseRoomFormClick()}>Cancel</button>
              <button type='submit' value='Rename'>Rename</button>
            </div>
          </fieldset>
        </form>
      </div>
    );
  }
};

export default RoomList;
