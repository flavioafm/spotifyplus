import {
  SwitchHorizontalIcon,
  VolumeUpIcon as VolumeDownIcon,
} from "@heroicons/react/outline";
import {
  FastForwardIcon,
  PauseIcon,
  PlayIcon,
  ReplyIcon,
  VolumeUpIcon,
  RewindIcon,
} from "@heroicons/react/solid";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { currentTrackIdState, isPlayingState } from "../atom/songAtom";
import useSongInfo from "../hooks/useSongInfo";
import useSpotify from "../hooks/useSpotify";

function Player() {
  const spotifyApi = useSpotify();
  const { data: session, status } = useSession();
  const [currentTrack, setCurrentTrack] = useRecoilState(currentTrackIdState);
  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [volume, setVolume] = useState(50);

  const songInfo = useSongInfo();

  const fetchCurrentInfo = () => {
    if (!songInfo) {
      spotifyApi.getMyCurrentPlayingTrack().then((data) => {
        console.log("Now playing: ", data.body?.item);
        setCurrentTrack(data.body?.item?.id);

        spotifyApi.getMyCurrentPlaybackState().then((data) => {
          setIsPlaying(data.body?.is_playing);
        });
      });
    }
  };

  const handlePlayPause = () => {
      spotifyApi.getMyCurrentPlaybackState().then((data) => {
          if (data.body.is_playing) {
              spotifyApi.pause();
              setIsPlaying(false);
          } else {
            spotifyApi.play();
            setIsPlaying(true);
          }
      });
  }

  useEffect(() => {
    if (spotifyApi.getAccessToken() && !currentTrack) {
      //fetch the song info
      fetchCurrentInfo();
      setVolume(50);
    }
  }, [currentTrackIdState, spotifyApi, session]);

  useEffect(() => {
    if (volume > 0 && volume < 100) {
        debounceAdjustVolume(volume);
    }
  }, [volume])

  const debounceAdjustVolume = useCallback(
    debounce((volume) => {
        spotifyApi.setVolume(volume).catch((err) => {})
    }, 500),
    []
  )

  return (
    <div
      className="h-24 bg-gradient-to-b from-black to-gray-900 text-white grid 
        grid-cols-3 text-xs md:text-base px-2 md:px-8"
    >
      {/* left */}
      <div className="flex items-center space-x-4">
        <img
          className="hidden md:inline h-10 w-10"
          src={songInfo?.album.images?.[0]?.url}
          alt=""
        />
        <div>
          <h3>{songInfo?.name}</h3>
          <p>{songInfo?.artists?.[0]?.name}</p>
        </div>
      </div>

      {/* center */}
      <div className="flex items-center justify-evenly">
        <SwitchHorizontalIcon className="button" />
        <RewindIcon
          //onClick={() => spotifyApi.skipToPrevious()} -- The API is not working
          className="button"
        />
        {isPlaying ? (
          <PauseIcon onClick={handlePlayPause} className="button w-10 h-10" />
        ) : (
          <PlayIcon onClick={handlePlayPause} className="button w-10 h-10" />
        )}
        <FastForwardIcon
          //onClick={() => spotifyApi.skipToNext()} -- The API is not working
          className="button"
        />
        <ReplyIcon className="button" />
      </div>

      {/* right */}
      <div className="flex items-center space-x-3 md:space-x-4 justify-end">
          <VolumeDownIcon 
            className="button"
            onClick={() => volume > 0 && setVolume(volume - 10)}
          />
          <input 
            className="w-14 md:w-28" 
            type="range" 
            value={volume} 
            min={0} 
            max={100}
            onChange={e => setVolume(Number(e.target.value))}
          />
          <VolumeUpIcon 
            className="button"
            onClick={() => volume < 100 && setVolume(volume + 10)}
          />
      </div>
    </div>
  );
}

export default Player;
