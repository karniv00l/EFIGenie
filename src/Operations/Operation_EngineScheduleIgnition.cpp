#include "Operations/Operation_EngineScheduleIgnition.h"
#include "Config.h"
using namespace EmbeddedIOServices;

#ifdef OPERATION_ENGINESCHEDULEIGNITION_H
namespace OperationArchitecture
{
	Operation_EngineScheduleIgnition::Operation_EngineScheduleIgnition(ITimerService *timerService, Operation_EnginePositionPrediction *predictor, float tdc, ICallBack *dwellCallBack, ICallBack *igniteCallBack)
	{
		_timerService = timerService;
		_tdc = tdc;
		_predictor = predictor;
		_dwellCallBack = dwellCallBack;
		_igniteCallBack = igniteCallBack;
		_dwellTask = new Task(new CallBack<Operation_EngineScheduleIgnition>(this, &Operation_EngineScheduleIgnition::Dwell), false);
		_igniteTask = new Task(new CallBack<Operation_EngineScheduleIgnition>(this, &Operation_EngineScheduleIgnition::Ignite), false);
	}

	std::tuple<uint32_t, uint32_t> Operation_EngineScheduleIgnition::Execute(EnginePosition enginePosition, float ignitionDwell, float ignitionAdvance)
	{
		if(enginePosition.Synced == false)
			return std::tuple<uint32_t, uint32_t>(0, 0);

		const uint32_t ticksPerSecond = _timerService->GetTicksPerSecond();
		const float ticksPerDegree = ticksPerSecond / enginePosition.PositionDot;
		const uint32_t ticksPerCycle = static_cast<uint32_t>((enginePosition.Sequential? 720 : 360) * ticksPerDegree);

		//we want to set the next dwell tick if ignitionDwell is > 0
		uint32_t dwellTick = 0;
		if(ignitionDwell > 0)
		{
			uint32_t dwellTicks = static_cast<uint32_t>(ignitionDwell * ticksPerSecond);
			dwellTick = _predictor->Execute(ignitionAdvance, enginePosition);
			dwellTick = dwellTick - dwellTicks;
			while(ITimerService::TickLessThanTick(dwellTick, enginePosition.CalculatedTick))
				dwellTick = dwellTick + ticksPerCycle;

			_timerService->ScheduleTask(_dwellTask, dwellTick);
			dwellTick = dwellTick == 0? 1 : dwellTick;
		}
		//otherwise we want to unschedule the dwell
		else
		{
			if(_dwellTask->Scheduled)
			{
				_timerService->UnScheduleTask(_dwellTask);
			}
		}

		//we only want to change the timing when we are not dwelling. otherwise our dwell could be too short or too long.
		if(_dwellingAtTick == 0)
			_ignitionAt = _tdc - ignitionAdvance;

		//but we do want to adjust the ignition tick so that it is spot on
		uint32_t ignitionTick = _predictor->Execute(_ignitionAt, enginePosition);
		//if the prediction is for a previous position. add for next position
		while((_dwellingAtTick == 0 && ITimerService::TickLessThanTick(ignitionTick, enginePosition.CalculatedTick)) || (_dwellingAtTick != 0 && ITimerService::TickLessThanTick(ignitionTick, _dwellingAtTick)))
			ignitionTick = ignitionTick + ticksPerCycle;

		_timerService->ScheduleTask(_igniteTask, ignitionTick);

		//return the ticks of the dwell and ignition. for debugging purposes
		return std::tuple<uint32_t, uint32_t>(dwellTick, ignitionTick == 0? 1 : ignitionTick);
	}

	void Operation_EngineScheduleIgnition::Dwell()
	{
		_dwellCallBack->Execute();
		_dwellingAtTick = _timerService->GetTick();
		if(_dwellingAtTick == 0)
			_dwellingAtTick = 1;
	}

	void Operation_EngineScheduleIgnition::Ignite()
	{
		_igniteCallBack->Execute();
		_dwellingAtTick = 0;
	}

	IOperationBase *Operation_EngineScheduleIgnition::Create(const void *config, unsigned int &sizeOut, const EmbeddedIOServiceCollection *embeddedIOServiceCollection, OperationPackager *packager)
	{
		Config::OffsetConfig(config, sizeOut, sizeof(uint32_t)); //skip over FactoryID
		const float tdc = Config::CastAndOffset<float>(config, sizeOut);
		const uint32_t dwellOperationId = Config::CastAndOffset<uint32_t>(config, sizeOut);
		const uint32_t igniteOperationId = Config::CastAndOffset<uint32_t>(config, sizeOut);
		// ICallBack * const dwellCallBack = new CallBack<IOperationBase>(, &IOperationBase::Execute);
		// ICallBack * const igniteCallBack = new CallBack<IOperationBase>(, &IOperationBase::Execute);
		ICallBack * const dwellCallBack = 0;
		ICallBack * const igniteCallBack = 0;
		
		return new Operation_EngineScheduleIgnition(embeddedIOServiceCollection->TimerService, new Operation_EnginePositionPrediction(embeddedIOServiceCollection->TimerService), tdc, dwellCallBack, igniteCallBack);
	}
}
#endif