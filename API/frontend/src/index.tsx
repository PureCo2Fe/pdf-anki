import { Streamlit, RenderData } from "streamlit-component-lib"

// Adds note to a deck
async function addFlashcard(deck: string, front: string, back: string, tags: string) {
  try {
    const note = {
      deckName: deck,
      modelName: 'Basic',
      fields: { Front: front, Back: back },
      options: { allowDuplicate: false },
      tags: [tags],
    };
    const addNoteResponse = await fetch('http://localhost:8765', {
      method: 'POST',
      body: JSON.stringify({
        action: 'addNote',
        params: { note: note },
        version: 6,
      }),
    });

    await addNoteResponse.json();
  } catch (error) {
    throw new Error('Error: Unable to reach the server');
  }
}
// Initialization: Check for Model Existence
async function checkModelExistence() {
  try {
    const payload = {
      action: "modelNames",
      version: 6,
    };
    const response = await fetch("http://localhost:8765", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const response_dict = await response.json();
    if (!response_dict.result.includes("Basic")) {
      const createPayload = {
        action: "createModel",
        version: 6,
        params: {
          modelName: "Basic",
          inOrderFields: ["Front", "Back"],
          isCloze: false,
          cardTemplates: [
            {
              Name: "My Card 1",
              Front: "{{Front}}",
              Back: "{{Back}}",
            },
          ],
        },
      };
      await fetch("http://localhost:8765", {
        method: "POST",
        body: JSON.stringify(createPayload),
      });
    }
  } catch (error) {
    throw new Error("Error: Unable to reach the server");
  }
}

// Checks if server reachable
async function reqPerm() {
  try {
    // Add the note to the deck
    const addNoteResponse = await fetch('http://localhost:8765', {
      method: 'POST',
      body: JSON.stringify({
        action: 'requestPermission',
        version: 6,
      }),
    });

    await addNoteResponse.json();
  } catch (error) {
    return false
  }
}

async function checkDeckExistence(deckName: string) {
  try {
    const payload = {
      action: "getDeckStats",
      version: 6,
      params: {
        decks: [deckName],
      },
    };
    const response = await fetch("http://localhost:8765", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const response_dict = await response.json();
    if (response_dict.error !== null) {
      const createPayload = {
        action: "createDeck",
        version: 6,
        params: {
          deck: deckName,
        },
      };
      const createResponse = await fetch("http://localhost:8765", {
        method: "POST",
        body: JSON.stringify(createPayload),
      });
      const createResponse_dict = await createResponse.json();
      if (createResponse_dict.error !== null) {
        throw new Error(
          "Error creating deck: " + createResponse_dict.error
        );
      }
    }
  } catch (error) {
    throw new Error("Error: Unable to reach the server");
  }
}

/**
 * The component's render function. This will be called immediately after
 * the component is initially loaded, and then again every time the
 * component gets new data from Python.
 */
async function onRender(event: Event): Promise<void> {
  // Get the RenderData from the event
  let success: void;
  const data = (event as CustomEvent<RenderData>).detail

  // RenderData.args is the JSON dictionary of arguments sent from the
  // Python script.
  let deck = data.args["deck"]
  let front = data.args["front"]
  let back = data.args["back"]
  let tags = data.args["tags"]
  let flag = data.args["flag"]
  
  try {
    switch (flag) {
      case "check":
        // Initialization for checking if server reachable and model exists
        await reqPerm();
        success = await checkModelExistence();
        break;
      case "createDeck":
        // Create Deck
        success = await checkDeckExistence(deck);
        break;
      default:
        // Add Anki Cards to Deck
        success = await addFlashcard(deck, front, back, tags);
        break;
    }
    Streamlit.setComponentValue(`Worked!, ${success}`);
  } catch (error) {
    Streamlit.setComponentValue("Error")
  }

  // We tell Streamlit to update our frameHeight after each render event, in
  // case it has changed. (This isn't strictly necessary for the example
  // because our height stays fixed, but this is a low-cost function, so
  // there's no harm in doing it redundantly.)
  Streamlit.setFrameHeight()
}

// Attach our `onRender` handler to Streamlit's render event.
Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender)

// Tell Streamlit we're ready to start receiving data. We won't get our
// first RENDER_EVENT until we call this function.
Streamlit.setComponentReady()

// Finally, tell Streamlit to update our initial height. We omit the
// `height` parameter here to have it default to our scrollHeight.
Streamlit.setFrameHeight()