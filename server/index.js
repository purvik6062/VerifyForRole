const express = require("express");
const { auth, resolver, loaders } = require("@iden3/js-iden3-auth");
const getRawBody = require("raw-body");
const { Server } = require("socket.io");
const cors = require("cors");
const { humanReadableAuthReason, proofRequest } = require("./proofRequest");
const path = require("path");
const { Routes } = require('discord-api-types/v9');
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const { Client, REST, IntentsBitField, GatewayIntentBits, Events, Partials, } = require("discord.js");
require("dotenv").config();
const request = require('request');

require("dotenv").config();

const app = express();
const port = 8080;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
);

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.options('*', cors());



// Assuming you have a route handling OAuth2 authentication
passport.use(new DiscordStrategy(
  {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    scope: ["identify"],
  },
  (accessToken, refreshToken, profile, done) => {
    console.log(accessToken);
    console.log(refreshToken);
    // Additional logic, if needed, to store user information in your database
    return done(null, profile);
  }
)
);

// Express session and Passport middleware setup
app.use(require("express-session")({
  secret: "your-secret-key",
  resave: true,
  saveUninitialized: true,
})
);

app.use(passport.initialize());
app.use(passport.session());

// Serialize and deserialize user functions
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));



app.get("/", (req, res) => {
  res.send(
    `Welcome to your backend Polygon ID verifier server! There are ${Object.keys(apiPath).length
    } routes available: ${Object.values(apiPath).join(" and ")}.`
  );
});

const server = app.listen(port, () => {
  console.log(`server running on port ${port}`);
});


const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
  },
});


const myClient = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessageReactions,
    IntentsBitField.Flags.GuildMessageReactions,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

myClient.login(process.env.TOKEN);


const commands = [
  {
    name: 'verify',
    description: 'Initiate the verification process.',
  },
];

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();


myClient.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;
    // const discordUserId = interaction.user.id
    // interactionsInProgress.add(discordUserId);
    console.log(interaction);
    if (commandName === 'verify' && interaction.channelId === process.env.GET_A_ROLE_CHANNEL_ID) {
      await interaction.deferReply({ ephemeral: true });

      // Initial reply with the "Verify" button
      interaction.editReply({
        content: 'Please click the "Verify" button to initiate the verification process.',
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                label: 'Verify',
                customId: 'verify-button',
              },
            ],
          },
        ],
      });
    } else {
      // Reply if the command is used in the wrong channel
      const getARoleChannel = myClient.channels.cache.get(process.env.GET_A_ROLE_CHANNEL_ID);
      const replyMessage = getARoleChannel
        ? `This command can only be used in the ${getARoleChannel.toString()} channel.`
        : 'This command can only be used in the #get-a-role channel.';
      interaction.reply(replyMessage);
    }
  } else if (interaction.isButton()) {
    // Handle button interactions
    const { customId } = interaction;

    if (customId === 'verify-button') {
      // Handle the "Verify" button click
      await interaction.deferReply({ ephemeral: true });

      const verificationUrlWithUserId = `${process.env.VERIFICATION_URL}?userId=${interaction.user.id}`;
      // Edit the initial reply to include the verification link
      interaction.editReply({
        content: 'Please click the link below to verify your credential:',
        embeds: [{
          title: 'Verification Page',
          description: 'To gain the VC-Holder role, you must first verify your verifiable credential. This process ensures that you are indeed a VC-Holder. Once the verification is done successfully, you will get the role. Click the link below to start the verification:',
          color: 0x3498db,
          thumbnail: {
            url: 'https://en.wikialpha.org/mediawiki/images/f/f9/Blue_Verified.png',
          },
          footer: {
            text: 'Verification System',
            icon_url: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
          },
        }],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: 'Verify Credential',
                url: verificationUrlWithUserId,
              },
            ],
          },
        ],
      });
    }
  }
});



// save auth qr requests
const authRequests = new Map();

const apiPath = {
  getAuthQr: "/api/get-auth-qr",
  handleVerification: "/api/verification-callback",
};

app.get(apiPath.getAuthQr, (req, res) => {
  getAuthQr(req, res);
});

app.post(apiPath.handleVerification, (req, res) => {
  handleVerification(req, res);
});

const STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  ERROR: "ERROR",
  DONE: "DONE",
};

const socketMessage = (fn, status, data) => ({
  fn,
  status,
  data,
});

// GetQR returns auth request
async function getAuthQr(req, res) {
  const sessionId = req.query.sessionId;

  console.log(`getAuthQr for ${sessionId}`);

  io.sockets.emit(
    sessionId,
    socketMessage("getAuthQr", STATUS.IN_PROGRESS, sessionId)
  );

  const uri = `${process.env.HOSTED_SERVER_URL}${apiPath.handleVerification}?sessionId=${sessionId}`;
  // Generate request for basic authentication
  // https://0xpolygonid.github.io/tutorials/verifier/verification-library/request-api-guide/#createauthorizationrequest
  const request = auth.createAuthorizationRequest(
    humanReadableAuthReason,
    process.env.VERIFIER_DID,
    uri
  );

  request.id = sessionId;
  request.thid = sessionId;

  const scope = request.body.scope ?? [];
  request.body.scope = [...scope, proofRequest];

  // store this session's auth request
  authRequests.set(sessionId, request);

  io.sockets.emit(sessionId, socketMessage("getAuthQr", STATUS.DONE, request));

  return res.status(200).set("Content-Type", "application/json").send(request);
}

// handleVerification verifies the proof after get-auth-qr callbacks
async function handleVerification(req, res) {
  console.log("authRequests in handleVerification", authRequests);
  const sessionId = req.query.sessionId;
  console.log("sessionId in handleVerification", sessionId);

  // get this session's auth request for verification
  const authRequest = authRequests.get(sessionId);

  console.log(`handleVerification for ${sessionId}`);

  io.sockets.emit(
    sessionId,
    socketMessage("handleVerification", STATUS.IN_PROGRESS, authRequest)
  );

  // get JWZ token params from the post request
  const raw = await getRawBody(req);
  const tokenStr = raw.toString().trim();

  // The CredentialAtomicQuerySigValidator contract is used to verify any credential-related zk proof
  // generated by the user using the credentialAtomicQuerySigV2OnChain circuit.
  // https://0xpolygonid.github.io/tutorials/contracts/overview/#blockchain-addresses
  const mumbaiContractAddress = "0x134B1BE34911E39A8397ec6289782989729807a4";
  const keyDIR = "./keys";

  const ethStateResolver = new resolver.EthStateResolver(
    process.env.RPC_URL_MUMBAI,
    mumbaiContractAddress
  );

  const resolvers = {
    ["polygon:mumbai"]: ethStateResolver,
  };

  // // console.log(path.join(__dirname, keyDIR))

  // Locate the directory that contains circuit's verification keys
  const verifier = await auth.Verifier.newVerifier(
    {
      stateResolver: resolvers,
      circuitsDir: path.join(__dirname, keyDIR),
      ipfsGatewayURL: "https://ipfs.io"
    }
  );

  // console.log(verifier)
  try {
    const opts = {
      AcceptedStateTransitionDelay: 5 * 60 * 1000, // up to a 5 minute delay accepted by the Verifier
    };
    authResponse = await verifier.fullVerify(tokenStr, authRequest, opts);
    const userId = authResponse.from;
    io.sockets.emit(
      sessionId,
      socketMessage("handleVerification", STATUS.DONE, authResponse)
    );
    return res
      .status(200)
      .set("Content-Type", "application/json")
      .send("User " + userId + " succesfully authenticated");
  } catch (error) {
    console.log(
      "Error handling verification: Double check the value of your RPC_URL_MUMBAI in the .env file. Are you using a valid api key for Polygon Mumbai from your RPC provider? Visit https://alchemy.com/?r=zU2MTQwNTU5Mzc2M and create a new app with Polygon Mumbai"
    );
    console.log("handleVerification error", sessionId, error);
    io.sockets.emit(
      sessionId,
      socketMessage("handleVerification", STATUS.ERROR, error)
    );
    return res.status(500).send(error);
  }
}
