function notImplemented(action) {
  return Promise.reject({ code: "NOT_IMPLEMENTED", action, message: "Rotina não implementada. Aguardando módulo de programação com arquivos autorizados." });
}

function readEcu() {
  return notImplemented("readEcu");
}

function writeEcu() {
  return notImplemented("writeEcu");
}

function cleanEcu() {
  return notImplemented("cleanEcu");
}

function validateAuthorizedFile() {
  return notImplemented("validateAuthorizedFile");
}

module.exports = { readEcu, writeEcu, cleanEcu, validateAuthorizedFile };
