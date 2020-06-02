import React, { useEffect, useState } from 'react';
import Compose from '../Compose';
import Toolbar from '../Toolbar';
import ToolbarButton from '../ToolbarButton';
import Message from '../Message';
import moment from 'moment';
import axios from 'axios';
import socketIOClient from 'socket.io-client';
import './MessageList.css';
import { Col } from 'reactstrap';

const socket = socketIOClient('http://localhost:5000/');

export default function MessageList(props) {
  console.log(props);
  var [MY_USER_ID, setID] = useState('');
  const [messages, setMessages] = useState(props.msgs);
  const [change, setChange] = useState(false);
  const [lastMsgId, setLastMsgId] = useState(0);

  function formatMsgs(tempMsg, update = false) {
    let formattedMsgs = messages;
    if (update) formattedMsgs = [];
    tempMsg.forEach((val, index) => {
      let formattedMsg = {};
      formattedMsg.id = val.id;
      formattedMsg.author = val.sender;
      formattedMsg.message = val.msg;
      formattedMsg.timestamp = new Date().getTime();
      formattedMsgs.push(formattedMsg);
    });
    return formattedMsgs;
  }

  const init = () => {
    axios
      .get('http://localhost:5000/api/user/getUserName', {
        headers: {
          'milaap-auth-token': localStorage.getItem('milaap-auth-token')
        }
      })
      .then((resp) => {
        setID(resp.data.username);
        socket.on('newMessage', (data) => {
          // console.clear();
          console.log('New Message Arrived');

          if (props.roomName !== 'dashboard' && data !== resp.data.username)
            fetchMessages();
          // if (props.roomName !== "dashboard") fetchMessages();
        });
      })
      .catch((err) => {
        console.log(err, 'Error in Verifying JWT');
      });
  };
  useEffect(() => {
    init();
  }, [props.roomName]);

  useEffect(() => {
    setMessages(props.msgs);
  }, [props.roomName])

  const getReqData = () => {
    // console.clear()
    return {
      roomName: props.roomName,
      lastMsgId: messages && messages.length > 0 ? messages[messages.length - 1].id + 1 : -1
    };
  };
  const fetchMessages = (change = false) => {
    return;
    // console.clear();
    console.log(change);
    var reqData = getReqData();
    // console.clear();
    // console.log(reqData);
    if (change == true) {
      if(reqData) {
        reqData.lastMsgId = -1;
      }
    }
    axios
      .post('http://localhost:5000/api/room/getmsgs', reqData, {
        headers: {
          'milaap-auth-token': localStorage.getItem('milaap-auth-token')
        }
      })
      .then((res) => {
        let tempMsg = res.data.msgs;
        if (JSON.stringify(tempMsg) === JSON.stringify(messages)) return;
        //console.clear();
        // console.clear();
        // alert(1)
        console.log(messages);
        console.log(tempMsg);
        console.log(tempMsg.length);
        console.log(reqData);

        if (tempMsg == undefined) {
          tempMsg = [];
        }
        const tempMsgFormatted = formatMsgs(tempMsg);
        setMessages(tempMsgFormatted);
        console.log(tempMsgFormatted[tempMsgFormatted.length - 1].id);
        setLastMsgId(tempMsgFormatted[tempMsgFormatted.length - 1].id);
        console.log(messages);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    //getMessages();
    // console.clear();
    // console.log(props.roomName);
    if (props.roomName !== 'dashboard') fetchMessages(true);

    //If you are on a limited DataPack, Comment this code segment and the one at
    //the end of useEffect function - (the one with return clearInterval...), to
    //prevent unnecessary multiple calls to the server
    /*
    const interval = setInterval(() => {
            let reqData = {
                    roomName: props.roomName,
                    lastMsgId: lastMsgId
            };
            console.log(reqData);
            axios.post('http://localhost:5000/api/room/getmsgs', reqData)
                  .then(res => {
                          console.log(res);
                          let tempMsg = res.data.msgs;
                          if(tempMsg == undefined) {
                                  tempMsg = [];
                          }
                          let tempMsgFormatted = formatMsgs(tempMsg);
                          console.log(tempMsgFormatted[tempMsgFormatted.length - 1].id);
                          setLastMsgId(tempMsgFormatted[tempMsgFormatted.length - 1].id);
                          let newMsgs = messages.concat(tempMsgFormatted);
                          setMessages(newMsgs);
                  }) .catch(err => {
                          console.log(err);
            });
    }, 10000);
    */

    //Yes this line.
    //return () => clearInterval(interval);
  }, []);

  const renderMessages = () => {
    // console.clear()
    if(!messages) {
      console.log("no messages");
      return;
    }
    console.log(messages);
    console.log(messages.length);
    let i = 0;
    const messageCount = messages.length;
    const tempMessages = [];

    while (i < messageCount) {
      const previous = messages[i - 1];
      const current = messages[i];
      const next = messages[i + 1];
      const isMine = current.author === MY_USER_ID;
      const currentMoment = moment(current.timestamp);
      let prevBySameAuthor = false;
      let nextBySameAuthor = false;
      let startsSequence = true;
      let endsSequence = true;
      let showTimestamp = true;

      if (previous) {
        const previousMoment = moment(previous.timestamp);
        const previousDuration = moment.duration(currentMoment.diff(previousMoment));
        prevBySameAuthor = previous.author === current.author;

        if (prevBySameAuthor && previousDuration.as('hours') < 1) {
          startsSequence = false;
        }

        if (previousDuration.as('hours') < 1) {
          showTimestamp = false;
        }
      }

      if (next) {
        const nextMoment = moment(next.timestamp);
        const nextDuration = moment.duration(nextMoment.diff(currentMoment));
        nextBySameAuthor = next.author === current.author;

        if (nextBySameAuthor && nextDuration.as('hours') < 1) {
          endsSequence = false;
        }
      }
      if (messageCount == 1) endsSequence = false;
      tempMessages.push(
        <Message
          key={i}
          isMine={isMine}
          startsSequence={startsSequence}
          endsSequence={endsSequence}
          showTimestamp={showTimestamp}
          data={current}
        />
      );

      // Proceed to the next message.
      i += 1;

      // console.log(current);
    }
    console.log(tempMessages);
    return tempMessages;
  };
  const updateMsg = (msgObject) => {
    let newMsgs = [msgObject];
    let newFormattedMsg = formatMsgs(newMsgs, true);
    newMsgs = messages.concat(newFormattedMsg);
    setMessages(newMsgs);
  };

  return (
    <div className="message-list bg-dark">
      <Toolbar
        title={props.roomName}
        /*
    rightItems={[
      <ToolbarButton key="info" icon="ion-ios-information-circle-outline" />,
      <ToolbarButton key="video" icon="ion-ios-videocam" />,
      <ToolbarButton key="phone" icon="ion-ios-call" />
    ]}
           */
      />

      <div className="message-list-container bg-dark">{renderMessages()}</div>

      <Compose
        rightItems={[
          <ToolbarButton key="photo" icon="ion-ios-camera" />,
          <ToolbarButton key="image" icon="ion-ios-image" />,
          <ToolbarButton key="audio" icon="ion-ios-mic" />,
          <ToolbarButton key="money" icon="ion-ios-card" />,
          <ToolbarButton key="games" icon="ion-logo-game-controller-b" />,
          <ToolbarButton key="emoji" icon="ion-ios-happy" />
        ]}
        roomName={props.roomName}
        callback={updateMsg}
      />
    </div>
  );
}
