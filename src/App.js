import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  HStack,
  Input,
  VStack,
} from "@chakra-ui/react";
import Message from "./Components/Message";
import { app } from "./Firebase";
import {
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider);
};

const logoutHandler = () => signOut(auth);

// Function to delete a message by its document ID
const deleteMessage = async (messageId) => {
  try {
    await deleteDoc(doc(db, "Messages", messageId));
  } catch (error) {
    alert(error);
  }
};

function App() {
  const [user, setUser] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const divForScroll = useRef(null);

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      setMessage("");

      await addDoc(collection(db, "Messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp(),
      });

      divForScroll.current.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      alert(error);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "Messages"), orderBy("createdAt", "asc"));

    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data);
    });

    const unsubscribeForMessage = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          return { id, ...item.data() };
        })
      );
    });

    return () => {
      unsubscribe();
      unsubscribeForMessage();
    };
  }, []);

  // Function to delete a message
  const handleDeleteMessage = async (messageId) => {
    await deleteMessage(messageId);
  };

  return (
    <Box bg={"red.100"}>
      {user ? (
        <Container h={"100vh"} bg={"white"}>
          <VStack h="full" paddingY={"4"}>
            <Button onClick={logoutHandler} colorScheme={"red"} w={"full"}>
              Logout
            </Button>

            <VStack
              h="full"
              w={"full"}
              overflowY="auto"
              css={{
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              {messages.map((item) => (
                <Message
                  key={item.id}
                  user={item.uid === user.uid ? "me" : "other"}
                  text={item.text}
                  uri={item.uri}
                >
                  {/* Include a delete button and handle the delete action */}
                  {user.uid === item.uid && (
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteMessage(item.id)}
                    >
                      Delete
                    </Button>
                  )}
                </Message>
              ))}

              <div ref={divForScroll}></div>
            </VStack>

            <form onSubmit={submitHandler} style={{ width: "100%" }}>
              <HStack>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={"Enter a Message..."} 
                  textColor={"black"} 
                  _placeholder={{ color: 'black' }}
                />
                <Button colorScheme={"purple"} type="submit">
                  Send
                </Button>
              </HStack>
            </form>
          </VStack>
        </Container>
      ) : (
        <VStack bg="white" justifyContent={"center"} h="100vh">
          <Button onClick={loginHandler} colorScheme={"purple"}>
            Sign In With Google
          </Button>
        </VStack>
      )}
    </Box>
  );
}

export default App;
