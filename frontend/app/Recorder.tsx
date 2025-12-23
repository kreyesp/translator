"use client";
import {useRef, useState} from "react";

export default function Recorder(){
    //object that records on the browser
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    //array that stores chunks of audio data
    const chunksRef = useRef<BlobPart[]>([]);

    //used for logic of recording or not
    const [isRecording, setIsRecording] = useState(false);
    //used to store recorded audio file
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [serverText, setServerText] = useState<string>("");
    
    //create the function that begins recording audio data
    async function startRecording(){
        setServerText("");
        setAudioUrl(null);

        //asks for permission to use microphone
        //if access granted, browser returns live audio data from the mic
        const stream = await navigator.mediaDevices.getUserMedia({audio:true});
        
        //changes which compression the browser can use
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")? "audio/webm;codecs=opus": "audio/webm";

        const mr = new MediaRecorder(stream, {mimeType});
        mediaRecorderRef.current = mr;
        chunksRef.current = [];

        //if data is available and collected, we save it onto the array
        mr.ondataavailable = (e) => {
            if (e.data.size>0) chunksRef.current.push(e.data);
        };

        mr.onstop = async () => {
            //stop mic so it is not used forever
            stream.getTracks().forEach((t)=>t.stop());


            //store audio into component
            const blob = new Blob(chunksRef.current, {type:mr.mimeType});
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);

            //uploading to backend
            const form = new FormData();
            form.append("file", blob, "recording.webm");

            const res = await fetch("/api/transcribe", {
                method:"POST",
                body: form,
            });

            if(!res.ok){
                setServerText(`Upload failed: ${res.status}`);
                return;
            }

            //Makes sure server sent info correctly
            const data = await res.json();
            setServerText(data.text ?? JSON.stringify(data));
        };

        mr.start();
        setIsRecording(true);
    }


    function stopRecording(){
        const mr = mediaRecorderRef.current;
        if(!mr)return;
        mr.stop();
        setIsRecording(false);
    }


    return (
        //show buttons
        <section style={{marginTop:16}}>
            <div style={{display: "flex", gap:12}}>
                <button onClick={startRecording} disabled={isRecording}>
                    Start Recording
                </button>
                <button onClick={stopRecording} disabled={!isRecording}>
                    Stop Recording
                </button>
            </div>

            {/*show audio link*/}
            {audioUrl && (
                <div style={{marginTop:12}}>
                    <p>Preview:</p>
                    <audio controls src= {audioUrl}/>
                </div>
            )}

            {/*show backend response*/}
            {serverText && (
                <div style={{marginTop:12}}>
                    <p>Backend response:</p>
                    <pre>{serverText}</pre>
                </div>
            )}


        </section>
    );

}