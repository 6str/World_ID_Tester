# todo:

contract address mumbai : d3v3ent allows signal re-use
0x59c6d3996F739c7960fD59c8eEaaD55aF8614Db3	

action_id: "wid_a4c0eed4ad6a1f24aadbcdd4fcb0ccf7", //d3vent frontend NOT staging (smoothy's)
action_id: "wid_staging_034a32eef8f9c2d4ac2cca30890c2e76", // on-chain engine
action_id: "wid_staging_7a9456d25763ab09db907a6e9fdd289a", // cloud engine


slimulator steps
webpage widget needs to be initialised with a valid action id for widget to show
signal needs to be set for widget to be enabled


on your web copy the qr code from the widget
go to https://simulator.worldcoin.org/
click enter or paste qr and paste (if it's not working, could be a problem with WID or project setup, or simulator service outage)
can check status page https://status.worldcoin.org/

notes:
at the time of writing
when testing with an onchain WID you can get away with verifying with the same simulator account several times. if using a cloud WID, it can track the use of nullifier hash so can't keep using the same id. something like that

REST API only supports cloud based action ids

