import React, { Component } from 'react';

class RoomList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rooms: []
    };
    this.roomsRef = this.props.firebase.database().ref('rooms');
    this.newRoomInput = null;
    this.renameRoomInput = null;
    this.formToCreateRoom = null;
    this.formToEditRoom = null;
  }

  loadSnapshot(snapshot) {
    const roomsObj = snapshot.val();
    let rooms = [];
    for (let roomId in roomsObj) {
      const aRoom = {};
      aRoom.key = roomId;
      aRoom.name = roomsObj[roomId].name;
      aRoom.uid = roomsObj[roomId].uid;
      aRoom.createdBy = roomsObj[roomId].createdBy;
      rooms.push(aRoom);
    }
    if (!this.props.currentRoom) {
      this.props.setCurrentRoom(rooms[0]);
    }
    this.setState({ rooms: rooms });
  }

  componentDidMount() {
    this.roomsRef.on('value', snapshot => this.loadSnapshot(snapshot));
    // document.addEventListener('keydown', this.ignoreEnterKey);
    // document.addEventListener('click', () => { this.clicktoClose() });
  }

  componentWillUnmount() {
    this.roomsRef.off('value', this.loadSnapshot);
    // document.removeEventListener('keydown', this.ignoreEnterKey);
    // document.removeEventListener('click', () => { this.clicktoClose() });
  }

  validateName(e, newName) {
    if (newName === null || newName.length === 0 || newName.trim() === '') {
      alert("Please enter a valid name.");
      e.preventDefault();
      return false;
    }
    else return true;
  }

  validateAction(isNew) {
    if (!this.props.currentUser) {
      alert("You have to sign in to edit or delete a room.");
      this.newRoomInput.value = '';
      this.renameRoomInput.value = '';
      return false;
    }
    if (!isNew) {
      if (this.props.currentUser.uid !== this.props.currentRoom.uid) {
        alert("You can only edit or delete your own posts.");
        return false;
      }
    }
    return true;
  }

  createRoom(e) {
    const name = this.newRoomInput.value;// (document.forms['formToCreateRoom']['inputRoomName'].value);
    if (this.validateAction(true) && this.validateName(e, name)) {

      // if (this.validateName(e, val)) {
      //   const newRef = this.roomsRef.push();
      //   newRef.set(val);
      // }
      const newRoom = {};
      const newRoomRef = this.roomsRef.push();

      newRoom.value = {
        name: name,
        uid: this.props.currentUser.uid,
        createdBy: this.props.currentUser.displayName
      };

      newRoomRef.set(newRoom.value)
        .then(() => {
          console.log('New room created: ',newRoom.value.name,' by ', newRoom.value.createdBy);
          const room = {
            key: newRoomRef.key,
            name: name,
            uid: this.props.currentUser.uid,
            createdBy: this.props.currentUser.displayName    
          };
          this.props.setCurrentRoom(room);
        })
        .catch((error) => {
          alert(error.message);
        });

      e.preventDefault();
      document.getElementById("formToCreateRoom").reset();
      document.getElementById("closeNewRoomModal").click();
    }
  }

  renameRoom(e) {
    const newName = this.renameRoomInput.value;
    if (this.validateAction(false) && this.validateName(e, newName)) {
      // const update = {};
      // update['rooms/' + this.props.currentRoom.key] = this.renameRoomInput.value;
      // this.props.firebase.database().ref().update(update)
      const clickedRoomRef = this.props.firebase.database().ref('rooms/' + this.props.currentRoom.key);
      clickedRoomRef.update({
        "name": newName
      })
        .then(() => {
          /*console.log("Rename room succeeded.")*/
          let room = {};
          for (let key in this.props.currentRoom){
            room[key] = this.props.currentRoom[key];
          }
          room['name'] = newName;
          this.props.setCurrentRoom(room);
        })
        .catch(error => { console.log(error.message) });
      e.preventDefault();
      document.getElementById("formToEditRoom").reset();
      document.getElementById("closeEditRoomModal").click();
    }
  }

  deleteRoom() {
    if (this.validateAction(false)) {
      const clickedRoomRef = this.props.firebase.database().ref('rooms/' + this.props.currentRoom.key);
      clickedRoomRef.remove()
        .then(/*()=>console.log("Remove succeeded.")*/)
        .catch(error => { console.log(error.message) });
      this.props.setCurrentRoom(this.state.rooms[0]);
      document.getElementById("formToEditRoom").reset();
      document.getElementById("closeEditRoomModal").click();
    }
  }

  hiliteRoom(room) {
    if (this.props.currentRoom != null && room.key === this.props.currentRoom.key)
      return <li className='list-group-item active' key={room.key} onClick={() => { this.props.setCurrentRoom(room); this.renameRoomInput.value = room.name }}>{room.name}</li>
    else {
      return <li className='list-group-item' key={room.key} onClick={() => { this.props.setCurrentRoom(room); this.renameRoomInput.value = room.name }}>{room.name}</li>;
    }
  }

  render() {
    //console.log("roomList.js render: props.currentRoom="+this.props.currentRoom);
    //console.log("roomList.js render: props.className="+this.props.className);
    return (
      <div className={this.props.className}>
        {/* list of existing rooms */}
        <div className="card">
          <div className='card-header text-center bg-light text-dark'>
            <h3 className='dropdown'>
              <a href="#" className="dropdown-toggle" data-toggle="dropdown">
                Rooms</a>
              <div className="dropdown-menu">
                <a href="#" className="dropdown-item" data-toggle="modal" data-target="#addRoomModal">
                  <i className="fas fa-plus"></i> Add A Room
                </a>
                <a href="#" className="dropdown-item" data-toggle="modal" data-target="#editRoomModal">
                  <i className="fas fa-pencil-alt"></i> Edit Room
                </a>
              </div>
            </h3>
          </div>
          <div className="card-body p-0 mt-3">
            <ul className='list-group-flush' style={{ WebkitPaddingStart: 0 }}>
              {
                this.state.rooms.map((room, index) => this.hiliteRoom(room)
                )}
            </ul>
          </div>
        </div>

        {/* MODAL to create new room. No checking for duplication. */}
        <div className="modal fade" id="addRoomModal">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Add A Room</h5>
                <button id='closeNewRoomModal' className="close" data-dismiss="modal">
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form name='formToCreateRoom' id='formToCreateRoom'
                  ref={(form) => { this.formToCreateRoom = form }}
                  onSubmit={(e) => this.createRoom(e)}>
                  <div className="form-group">
                    <label>Enter a room name</label>
                    <input type='text' ref={input => this.newRoomInput = input} className="form-control" name='inputRoomName' />
                  </div>
                  <div className="modal-footer">
                    <button type='submit' className="btn btn-success" >Save Changes</button>
                    {/* data-dismiss="modal" prevents sending input value */}

                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL to edit room */}
        <div className="modal fade" id="editRoomModal">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Edit Room</h5>
                <button id='closeEditRoomModal' className="close" data-dismiss="modal">
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form name='formToEditRoom' id='formToEditRoom'
                  ref={(form) => { this.formToEditRoom = form }}>
                  <div className="form-group">
                    <label htmlFor="title">Enter new room name</label>
                    <input type='text' className="form-control" name='newRoomName'
                      required ref={input => this.renameRoomInput = input} />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" value='Rename' onClick={(e) => this.renameRoom(e)}>Save Changes</button>
                <button className="btn btn-warning" value='Delete' onClick={(e) => this.deleteRoom(e)}>Delete room</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }
};

export default RoomList;
