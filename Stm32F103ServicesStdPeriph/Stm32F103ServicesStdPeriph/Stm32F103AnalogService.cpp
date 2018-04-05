#include <stm32f10x_gpio.h>
#include <stm32f10x_rcc.h>
#include <stm32f10x_adc.h>
#include <stdint.h>
#include "IAnalogService.h"
#include "Stm32F103AnalogService.h"

namespace Stm32
{
	Stm32F103AnalogService::Stm32F103AnalogService()
	{
		RCC->CFGR = (RCC->CFGR & 0xFFFF3FFF) | RCC_PCLK2_Div6;
		ADC1->CR1 &= 0xFFF0FEFF;
		ADC1->CR2 = (ADC1->CR2 & 0xFFF1F7FD) | ADC_ExternalTrigConv_None;
		ADC1->SQR1 &= 0xFF0FFFFF;
		ADC1->CR2 |= 0x00000001;

		//calibrate the ADC
		ADC1->CR2 |= 0x00000008;
		while (ADC1->CR2 & 0x00000008) ;
		ADC1->CR2 |= 0x00000004;
		while (ADC1->CR2 & 0x00000004) ;
	}

	void Stm32F103AnalogService::InitPin(unsigned char pin)
	{
		if (pin == 0)
			return;
		pin -= 1;
		
		if (pin < 8)
		{
			GPIOA->CRL = (GPIOA->CRL & (0x0F << pin)) | (((GPIO_Mode_AIN & 0x0F) | GPIO_Speed_50MHz) << pin);
		}
		else if (pin > 15 && pin < 18)
		{
			GPIOB->CRL = (GPIOB->CRL & (0x0F << pin)) | (((GPIO_Mode_AIN & 0x0F) | GPIO_Speed_50MHz) << (pin-16));
		}
	}
	
	float Stm32F103AnalogService::ReadPin(unsigned char pin)
	{
		if (pin == 0)
			return 0;
		pin -= 1;
		if (pin > 15)
			pin -= 8;
		
		//set the channel to the pin we want to read
		if(pin > ADC_Channel_9)
		{
			ADC1->SMPR1 = (ADC1->SMPR1 & ~(0x7 << (3*(pin - 10)))) | (ADC_SampleTime_1Cycles5 << (3*(pin - 10)));
		}
		else
		{
			ADC1->SMPR1 = (ADC1->SMPR1 & ~(0x7 << (3*pin))) | (ADC_SampleTime_1Cycles5 << (3*pin));
		}
		ADC1->SQR3 = (ADC1->SQR3 & ~0x1F) | pin;
			
		//start the conversion
		ADC1->CR2 |= 0x00500000;
		//wait for conversion to finish
		while(!(ADC1->SR & ADC_FLAG_EOC)) ;
		//return the value
		return ADC1->DR * 0.000244140625f * 3.3;   //convert from 12 bit to float and convert to voltage
	}
}