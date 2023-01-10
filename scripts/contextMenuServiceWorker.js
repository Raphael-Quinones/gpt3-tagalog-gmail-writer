// Create a counter to keep track of the number of clicks
let clickCounter = 0;

// Specify the maximum number of clicks allowed
const MAX_CLICKS = 2;

const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      if (result['openai-key']) {
        const decodedKey = atob(result['openai-key']);
        resolve(decodedKey);
      }
    });
  });
};

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
    const activeTab = tab[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (response.status === 'failed') {
          console.log('injection failed.');
        }
      }
    );
  });
};


const generate = async (prompt) => {
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';
	
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 1250,
      temperature: 0.7,
    }),
  });
	
  const completion = await completionResponse.json();
  return completion.choices.pop();
}



const generateCompletionAction = async (info) => {
	try {
      if (clickCounter >= MAX_CLICKS) {
        //Send warning that they have reached max number of clicks
        console.log("You have reached max number of clicks")
        sendMessage("You have reached max number of clicks. Please upgrade to a higher tier")
      }
    else{
            //Increment ClickCounter
            clickCounter++;
            console.log("Clicks total: ", clickCounter)
            // Send mesage with generating text (this will be like a loading indicator)
            sendMessage('generating...');
    
            const { selectionText } = info;
            const basePromptPrefix =
            `
            Write me a detailed table of contents for an email with the topic below.
      
            Topic:
            `;
      
            const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);
        
          const secondPrompt = 
            `
            Take the table of contents and topic of the email below and generate a full formal email. .
      
            Topic: ${selectionText}
      
            Table of Contents: ${baseCompletion.text}
      
            Email:
            `;
            
            const secondPromptCompletion = await generate(secondPrompt);
            
          // Send the output when we're all done
          sendMessage(secondPromptCompletion.text);
    }
  } catch (error) {
    console.log(error);

		// Add this here as well to see if we run into any errors!
		sendMessage(error.toString());
  }
};

chrome.contextMenus.create({
  id: 'context-run',
  title: 'Generate Email',
  contexts: ['selection'],
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);