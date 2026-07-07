export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Mensagens em português: sem imposição de case no subject
    "subject-case": [0],
    // Corpos longos explicando o porquê são incentivados
    "body-max-line-length": [0],
  },
};
