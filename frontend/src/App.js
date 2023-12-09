import "./App.css";
import { useState, useEffect } from "react";
import PolygonIDVerifier from "./PolygonIDVerifier";
import VcGatedDapp from "./VcGatedDapp";
import axios from "axios";
import { Center, Card, Image, CardBody, Container, Heading, Button } from "@chakra-ui/react";

function App() {
  const [provedAccessFinalist, setProvedAccessFinalist] = useState(false);

  const [discordUserId, setDiscordUserId] = useState(null)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const userId = searchParams.get('userId');

    console.log('User ID from URL:', userId);

    if (userId) {
      console.log(userId);
      setDiscordUserId(userId);
    } else {
      console.error('User ID is undefined or null');
    }
  }, []);


  useEffect(() => {
    const fetchData = async () => {
      if (discordUserId) {
        try {
          // Call the API with the correct URL and parameters
          const apiUrl = `http://localhost:8008/auth/discord/callback/${discordUserId}`;
          const response = await axios.get(apiUrl);

          console.log(response); // Check the response details

          if (response.status == 200) {
            console.log('Role assigned successfully');
            window.location.href = "https://discord.com/channels/1176838615268069398/1176839418401787944";
          } else {
            console.error('Failed to assign role:', response.data.error);
          }
        } catch (error) {
          console.error('Error calling API:', error.message);
        }
      } else {
        console.error('discordUserId is undefined or null');
      }
    };

    // Check if provedAccessBirthday is true and call fetchData
    if (provedAccessFinalist) {
      fetchData();
    }
  }, [provedAccessFinalist, discordUserId]);


  return (
    <>
      {provedAccessFinalist ? (
        // <VcGatedDapp />
        <Center>
          <Container>
            <Heading as="h1" textAlign="center" color="purple.500" mt={8}>
              Welcome! YOU ARE SUCCESSFULLY VERIFIED.
            </Heading>
            <Image
              src="https://bafybeibcgo5anycve5flw6pcz5esiqkvrzlmwdr37wcqu33u63olskqkze.ipfs.nftstorage.link/"
              alt="Polygon devs image"
              borderRadius="lg"
              mt={4}
            />
          </Container>
        </Center>
      ) : (
        <Center className="vc-check-page">
          <Container>
            <Card
              style={{
                border: "2px solid #805AD5",
                backgroundColor: "#EDF2F7",
              }}
            >
              <CardBody style={{ paddingBottom: 0 }}>
                <Heading as="h2" textAlign="center" color="purple.500" mb={4}>
                  Prove Your Identity to get your Discord Role!
                </Heading>

                <PolygonIDVerifier
                  publicServerURL={
                    process.env.REACT_APP_VERIFICATION_SERVER_PUBLIC_URL
                  }
                  localServerURL={
                    process.env.REACT_APP_VERIFICATION_SERVER_LOCAL_HOST_URL
                  }
                  credentialType={"KYCAgeCredential"}
                  issuerOrHowToLink={
                    "https://oceans404.notion.site/How-to-get-a-Verifiable-Credential-f3d34e7c98ec4147b6b2fae79066c4f6?pvs=4"
                  }
                  onVerificationResult={setProvedAccessFinalist}
                />
                <Image
                  src="https://bafybeibcgo5anycve5flw6pcz5esiqkvrzlmwdr37wcqu33u63olskqkze.ipfs.nftstorage.link/"
                  alt="Polygon devs image"
                  borderRadius="lg"
                />
              </CardBody>
              {/* <a
                // href="https://twitter.com/0ceans404"
                target="_blank"
                rel="noreferrer"
              >
                <p
                  style={{
                    position: "absolute",
                    bottom: "-15px",
                    right: "0",
                    fontSize: "8px",
                  }}
                >
                  Template built with 💜 by Steph
                </p>
              </a> */}
            </Card>
          </Container>
        </Center>
      )}
    </>
  );
}

export default App;
