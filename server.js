const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

const bodyParser = require("body-parser");
server.use(bodyParser.json());

server.use(middlewares);

server.post("/api/toggle-plugins", (req, res) => {
  let db = router.db;
  let toggleStatus = !req.body.toggleStatus;

  if (typeof toggleStatus !== "boolean") {
    res.status(400).send("Invalid toggle status");
    return;
  }

  let tabData = db.get("data.tabdata").value();

  for (let tab in tabData) {
    if (toggleStatus) {
      tabData[tab].disabled = tabData[tab].disabled.concat(
        tabData[tab].active,
        tabData[tab].inactive
      );
      tabData[tab].active = [];
      tabData[tab].inactive = [];
    } else {
      tabData[tab].active = tabData[tab].active.concat(tabData[tab].disabled);
      tabData[tab].disabled = [];
    }
  }

  db.set("data.tabdata", tabData).write();

  res.sendStatus(200);
});

server.post("/tabdata/:tab/:status/:id", (req, res) => {
  let db = router.db;
  let tab = req.params.tab;
  let oldStatus = req.params.status;
  let id = req.params.id;
  let newStatus = req.body.status;

  if (!newStatus || !["active", "inactive", "disabled"].includes(newStatus)) {
    res.status(400).send("Invalid new status");
    return;
  }

  let tabData = db.get(`data.tabdata.${tab}.${oldStatus}`).value();

  if (!tabData) {
    res.status(404).send(`Not found`);
    return;
  }

  let index = tabData.indexOf(id);
  if (index !== -1) {
    tabData.splice(index, 1);
    db.set(`data.tabdata.${tab}.${oldStatus}`, tabData).write();

    let newStatusArray = db.get(`data.tabdata.${tab}.${newStatus}`).value();

    if (!newStatusArray) {
      newStatusArray = [];
    }

    newStatusArray.push(id);
    db.set(`data.tabdata.${tab}.${newStatus}`, newStatusArray).write();
  }

  res.sendStatus(200);
});

server.use(router);

server.listen(3000, () => {
  console.log("JSON Server is running");
});
