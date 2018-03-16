#if defined(IFuelPumpServiceExists)
#define FuelPumpService_PwmExists
namespace EngineManagement
{
	class FuelPumpService_Pwm : public IFuelPumpService
	{
		unsigned char _pin;
		float _period;
		float _maxy;
		unsigned short _maxRpm;
		unsigned char _rpmResolution;
		unsigned char _yResolution;
		unsigned char *_pwmTable;
		unsigned char _primePwm;
		unsigned int _primeTime;
		unsigned char _currentPwm;
		bool _isOn;
		bool _normalOn;
		bool _useTps;
	public:
		bool Started = false;
		FuelPumpService_Pwm(void *config);
		void Prime();
		void On();
		void Off();
		void Tick();
		static void PrimeTaskOff(void *parameter);
	};
}
#endif