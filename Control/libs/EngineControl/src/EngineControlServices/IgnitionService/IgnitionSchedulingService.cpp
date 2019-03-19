#include "EngineControlServices/IgnitionService/IgnitionSchedulingService.h"

#ifdef IGNITIONSCHEDULINGSERVICE_H
namespace EngineControlServices
{
	IgnitionSchedulingService::IgnitionSchedulingService(
		const IgnitionSchedulingServiceConfig *ignitionSchedulingServiceConfig,
		IIgnitionConfig *ignitionConfig,
		IBooleanOutputService **ignitorOutputServices,
		ITimerService *timerService,
		IReluctor *crankReluctor,
		IReluctor *camReluctor)
	{
		_ignitionSchedulingServiceConfig = ignitionSchedulingServiceConfig;
		_ignitionConfig = ignitorOutputServices != 0 ? ignitionConfig : 0;
		_timerService = timerService;
		_crankReluctor = crankReluctor;
		_camReluctor = camReluctor;
		_ignitorDwellTask = (HardwareAbstraction::Task **)malloc(sizeof(HardwareAbstraction::Task *) * _ignitionSchedulingServiceConfig->Ignitors);
		_ignitorFireTask = (HardwareAbstraction::Task **)malloc(sizeof(HardwareAbstraction::Task *) * _ignitionSchedulingServiceConfig->Ignitors);
		int tickMinusSome = _timerService->GetTick() - 6;
		for (unsigned char ignitor = 0; ignitor < _ignitionSchedulingServiceConfig->Ignitors; ignitor++)
		{
			if (_ignitionConfig != 0)
			{
				_ignitorDwellTask[ignitor] = new Task(&IBooleanOutputService::OutputSetCallBack, ignitorOutputServices[ignitor], false);
				_ignitorFireTask[ignitor] = new  Task(&IBooleanOutputService::OutputResetCallBack, ignitorOutputServices[ignitor], false);
			}
		}
	}

	void IgnitionSchedulingService::ScheduleEvents(void)
	{
		bool isSequential;
		float schedulePosition;//0-720 when sequential and 0-360 otherwise
		float scheduleTickPerDegree;
		uint32_t scheduleTick;
		if(_crankReluctor != 0 && _crankReluctor->IsSynced())
		{
			if(_camReluctor != 0 && _camReluctor->IsSynced())
			{
				//we have both crank and cam
				//decide which one to use for scheduling.
				if(_camReluctor->GetResolution() <= _crankReluctor->GetResolution() * 2)
				{
					schedulePosition = _crankReluctor->GetPosition();
					scheduleTick = _timerService->GetTick();
					if(_camReluctor->GetPosition() >= 180)
					{
						//we are on the second half of the cam
						schedulePosition += 360;
					}
					scheduleTickPerDegree = _crankReluctor->GetTickPerDegree();
				}
				else
				{
					//the crank reluctor is essential useless unless the cam sensor goes out of sync
					schedulePosition = _camReluctor->GetPosition() * 2;
					scheduleTick = _timerService->GetTick();
					scheduleTickPerDegree = _camReluctor->GetTickPerDegree() * 2;
				}
				isSequential = true;
			}
			else
			{
				//we only have the crank sensor
				if (_ignitionSchedulingServiceConfig->SequentialRequired)
					return;
				schedulePosition = _crankReluctor->GetPosition();
				scheduleTick = _timerService->GetTick();
				scheduleTickPerDegree = _crankReluctor->GetTickPerDegree();
				isSequential = false;
			}
		}
		else if(_camReluctor != 0 && _camReluctor->IsSynced())
		{
			//we only have the cam sensor
			schedulePosition = _camReluctor->GetPosition() * 2;
			scheduleTick = _timerService->GetTick();
			scheduleTickPerDegree = _camReluctor->GetTickPerDegree() * 2;
			isSequential = true;
		}
		else
		{
			//we dont have any reluctors to use for scheduling
			return;
		}

		uint32_t ticksPerSecond = _timerService->GetTicksPerSecond();	
		
		unsigned short scheduleResolution = isSequential ? 720 : 360;
		IgnitionTiming ignitionTiming = _ignitionConfig->GetIgnitionTiming();

		const unsigned short *ignitorTdc = _ignitionSchedulingServiceConfig->IgnitorTdc();

		for (unsigned char ignitor = 0; ignitor < _ignitionSchedulingServiceConfig->Ignitors; ignitor++)
		{
			if (!ignitionTiming.IgnitionEnable)
			{
				_timerService->UnScheduleTask(_ignitorDwellTask[ignitor]);
			}
			else
			{
				float tdc = ignitorTdc[ignitor] * 0.015625f;
				if(tdc > scheduleResolution)
					tdc -= scheduleResolution;

				float degreesUntilFire = tdc - (ignitionTiming.IgnitionAdvance64thDegree * 0.015625f) - schedulePosition;
				while (degreesUntilFire < 0)
					degreesUntilFire += scheduleResolution;		
				while (degreesUntilFire > scheduleResolution)
					degreesUntilFire -= scheduleResolution;	
				if(degreesUntilFire > scheduleResolution / 2)
					continue;

				uint32_t ignitionFireTick = static_cast<uint32_t>(round(scheduleTick + (scheduleTickPerDegree * degreesUntilFire)));
				
				uint32_t ignitionDwellTick = static_cast<uint32_t>(round(ignitionFireTick - (ignitionTiming.IgnitionDwellTime * ticksPerSecond)));

				if(ITimerService::TickLessThanTick(_timerService->GetTick(), ignitionFireTick))
				{
					if(_timerService->ScheduleTask(_ignitorFireTask[ignitor], ignitionFireTick)
						&& ITimerService::TickLessThanTick(_timerService->GetTick(), ignitionDwellTick))
					{
						_timerService->ScheduleTask(_ignitorDwellTask[ignitor], ignitionDwellTick);
					}
				}

				uint32_t fire = _ignitorFireTask[ignitor]->Tick;
				uint32_t dwell = _ignitorDwellTask[ignitor]->Tick;

				//  if(fire != 0 && dwell != 0 && fire-dwell > 500000)
				//  	asm("bkpt");
			}
		}
	}

	void IgnitionSchedulingService::ScheduleEventsCallBack(void *ignitionSchedulingService)
	{
		((IgnitionSchedulingService*)ignitionSchedulingService)->ScheduleEvents();
	}
}
#endif