// Create a counter to keep track of the number of clicks
let clickCounter = 0;

// Specify the maximum number of clicks allowed
const MAX_CLICKS = 50;

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
  //fetches api key securely from endpoint
  const key = await fetch('https://8c8fe7b8bg.execute-api.ap-northeast-1.amazonaws.com/default/apiSecureKeys', {
    method: 'post',
  })
  .then(response => response.text())
  .then(data => {
    const processed = JSON.parse(data)
    console.log("Inside getKeyFromSomewhere: " + processed.message)
    const fetchedAPI = processed.message
    return fetchedAPI
})

  console.log(key);
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
  console.log(completion)
  return completion.choices.pop();
}



const generateCompletionAction = async (info) => {
	try {
      if (clickCounter >= MAX_CLICKS) {
        //Send warning that they have reached max number of clicks
        console.log("You have reached max number of clicks")
        sendMessage("You have reached max number of clicks. Please contact us on our facebook page https://www.facebook.com/profile.php?id=100089796541298 for more emails")
      }
    else{
            //Increment ClickCounter
            clickCounter++;
            console.log("Clicks total: ", clickCounter)
            // Send mesage with generating text (this will be like a loading indicator)
            sendMessage('generating...');
            //Sends number of generations made
            sendMessage('You have generated ' + clickCounter + ' out of ' + MAX_CLICKS + '. Generating your email...')
    
            const { selectionText } = info;
            const basePromptPrefix =
            `
            Write me a professional detailed english email from the tagalog instructions/topic below.
      
            Tagalog Topic:
            `;
      
            const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);
            
          // Send the output when we're all done
          sendMessage(baseCompletion.text);
    }
  } catch (error) {
    console.log(error);

		// Add this here as well to see if we run into any errors!
		sendMessage(error.toString());
  }
};

chrome.contextMenus.create({
  id: 'context-run',
  title: 'Generate Tagalog Email',
  contexts: ['selection'],
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);