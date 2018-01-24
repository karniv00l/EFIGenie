namespace Decoder
{
	class Gm24xDecoder : public IDecoder
	{
	protected:
		uint8_t _state;
		uint8_t _crankState;
		bool _camTicked;
		bool _hasCamPosition;
		bool _isSynced;
		HardwareAbstraction::ITimerService *_timerService;
		unsigned int _lastCamTick;
		unsigned int _lastCrankTick;
		unsigned int _crankPeriod;
		unsigned int crankTime();
	public:
		Gm24xDecoder(HardwareAbstraction::ITimerService *timerService);
		float GetCrankPosition(void);
		float GetCamPosition(void);
		unsigned int GetTickPerDegree(void);
		uint16_t GetRpm(void);
		void CrankEdgeTrigger(EdgeTrigger edgeTrigger);
		void CamEdgeTrigger(EdgeTrigger edgeTrigger);
		bool IsSynced();
		bool HasCamPosition();
	};
}