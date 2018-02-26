#if defined(IAfrServiceExists) && defined(IMapServiceExists) && defined(ITpsServiceExists) && defined(IEthanolServiceExists)
#define AfrService_Map_EthanolExists
namespace EngineManagement
{
	class AfrService_Map_Ethanol : public IAfrService
	{
	protected:
		unsigned short *_gasMap;
		unsigned short *_ethanolMap;
		unsigned short _maxRpm;
		float _maxMapKpa;
		float _minEct;
		float _maxEct;
		bool _started = false;
		bool _aeDone = false;
		unsigned int _startupTick;
		float _startupAfrMultiplier;
		unsigned int _startupAfrTickDelay;
		unsigned int _startupAfrTickDecay;
		float *_ectMultiplierTable;
		unsigned short *_stoichTable;
		unsigned short *_tpsMinAfrGas;
		unsigned short *_tpsMinAfrEthanol;
		unsigned char _afrRpmResolution;
		unsigned char _afrMapResolution;
		unsigned char _afrEctResolution;
		unsigned char _afrTpsResolution;
		unsigned char _stoichResolution;
	public:
		AfrService_Map_Ethanol(void *config);
		void CalculateAfr();
	};
}
#endif