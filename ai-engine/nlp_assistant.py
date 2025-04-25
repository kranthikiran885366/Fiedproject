import pyttsx3
import speech_recognition as sr

def listen_command():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening for your command...")
        try:
            audio = recognizer.listen(source)
            command = recognizer.recognize_google(audio)
            return command.lower()
        except sr.UnknownValueError:
            return "Sorry, I did not understand that."

def respond(command):
    engine = pyttsx3.init()
    if "hello" in command:
        response = "Hello! How can I assist you today?"
    else:
        response = "Sorry, I don't understand that command."

    engine.say(response)
    engine.runAndWait()

if __name__ == "__main__":
    command = listen_command()
    respond(command)
