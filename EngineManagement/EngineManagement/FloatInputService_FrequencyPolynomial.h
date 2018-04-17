#include "HardwareAbstractionCollection.h"
#include "IFloatInputService.h"
#include "math.h"

#if !defined(FLOATINPUTSERVICE_FREQUENCYPOLYNOMIAL_H) && defined(IFLOATINPUTSERVICE_H) && defined(HARDWAREABSTRACTIONCOLLECTION_H) 
#define FLOATINPUTSERVICE_FREQUENCYPOLYNOMIAL_H
namespace IOService
{
	template<unsigned char Degree>
	struct __attribute__((__packed__)) FloatInputService_FrequencyPolynomialConfig
	{
	private:
		FloatInputService_FrequencyPolynomialConfig()
		{
			
		}
	public:
		static FloatInputService_FrequencyPolynomialConfig<Degree>* Cast(void *p)
		{
			return (FloatInputService_FrequencyPolynomialConfig<Degree> *)p;
		}
		unsigned int Size()
		{
			return sizeof(FloatInputService_FrequencyPolynomialConfig<Degree>);
		}
		unsigned char PwmPin;
		unsigned short MinFrequency;
		float A[Degree + 1];
		float MinValue;
		float MaxValue;
		unsigned short DotSampleRate;
	};

	template<unsigned char Degree>
	class FloatInputService_FrequencyPolynomial : public IFloatInputService
	{
		const HardwareAbstraction::HardwareAbstractionCollection *_hardwareAbstractionCollection;
		const FloatInputService_FrequencyPolynomialConfig<Degree> *_config;

		unsigned int _lastReadTick = 0;
		float _lastValue = 0;
	public:
		FloatInputService_FrequencyPolynomial(const HardwareAbstraction::HardwareAbstractionCollection *hardwareAbstractionCollection, const FloatInputService_FrequencyPolynomialConfig<Degree> *config)
		{
			_hardwareAbstractionCollection = hardwareAbstractionCollection;
			_config = config;

			_hardwareAbstractionCollection->PwmService->InitPin(_config->PwmPin, HardwareAbstraction::In, _config->MinFrequency);
		}

		void ReadValue()
		{
			HardwareAbstraction::PwmValue pwmValue = _hardwareAbstractionCollection->PwmService->ReadPin(_config->PwmPin);

			if (pwmValue.Period <= 0)
				return;

			float frequency = 1 / pwmValue.Period;

			Value = _config->A[0];
			for (int i = 1; i <= Degree; i++)
				Value += _config->A[i] * pow(frequency, i);
			if (Value < _config->MinValue)
				Value = _config->MinValue;
			else if (Value > _config->MaxValue)
				Value = _config->MaxValue;

			float elapsedTime = _hardwareAbstractionCollection->TimerService->GetElapsedTime(_lastReadTick);
			if (elapsedTime < 1.0 / _config->DotSampleRate)
				return;

			_lastReadTick = _hardwareAbstractionCollection->TimerService->GetTick();
			_lastValue = Value;
			ValueDot = (Value - _lastValue) / elapsedTime;
		}
	};
}
#endif