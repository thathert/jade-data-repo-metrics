const { WebClient } = require('@slack/web-api');

// Read a token from the environment variables
const token = process.env.SLACK_TOKEN;
const conversationId = process.env.SLACK_CONVERSATION_ID;

function getName(response) {
  if (response.details) {
    return response.details.name;
  }
  return response.metadata.name;
}

function getMessage(response, status) {
  if (response.reason) {
    return `${response.status}/${response.reason}: '${response.message}' (${status.message})`;
  }
  return `phase: ${response.status.phase}`;
}

function extractMessage(logData) {
  console.log(JSON.stringify(logData));
  const { resourceName, methodName, request, response, status } = logData.protoPayload;
  const images = request.spec.containers.map(container => container.image).join(', ');
  let output = `${logData.resource.labels.project_id}:${resourceName}:${methodName}\n`;
  output += `name: ${getName(response)}\n`;
  output += `image(s): ${images}\n`;
  output += getMessage(response, status);
  return output;
}

module.exports.helloPubSub = (event) => {
  const logData = JSON.parse(Buffer.from(event.data, 'base64').toString());

  // Initialize
  const web = new WebClient(token);
  return web.chat.postMessage({
    text: extractMessage(logData),
    channel: conversationId,
  });
};
